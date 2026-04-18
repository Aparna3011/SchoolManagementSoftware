import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CircleDollarSign,
  Download,
  GraduationCap,
  Pencil,
  Printer,
  Save,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'react-toastify';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { RegistrationFormPDF } from '../components/pdf/RegistrationFormPDF';

function toCurrency(value) {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function fullName(student) {
  if (!student) {
    return '-';
  }
  return student.surname ? `${student.surname} ${student.student_name}` : student.student_name;
}

function normalizeDue(value) {
  const amount = Number(value || 0);
  return amount > 0 ? amount : 0;
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Alumni', label: 'Alumni' },
  { value: 'Transferred', label: 'Transferred' },
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const PROOF_CONFIG = [
  {
    field: 'photo_path',
    label: 'Student Photo',
    prefix: 'student_profile_',
  },
  {
    field: 'father_govt_proof_path',
    label: 'Father Govt. Proof',
    prefix: 'father_govt_proof_',
  },
  {
    field: 'mother_govt_proof_path',
    label: 'Mother Govt. Proof',
    prefix: 'mother_govt_proof_',
  },
  {
    field: 'birth_certificate_path',
    label: 'Birth Certificate',
    prefix: 'birth_certificate_',
  },
];

function toBase64Pdf(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function normalizeEditForm(student) {
  return {
    surname: student?.surname || '',
    student_name: student?.student_name || '',
    dob: student?.dob || '',
    gender: student?.gender || '',
    religion: student?.religion || '',
    caste: student?.caste || '',
    nationality: student?.nationality || '',
    blood_group: student?.blood_group || '',
    mother_tongue: student?.mother_tongue || '',
    address: student?.address || student?.residential_address || '',
    father_name: student?.father_name || '',
    father_education: student?.father_education || '',
    father_occupation: student?.father_occupation || '',
    father_aadhaar_no: student?.father_aadhaar_no || '',
    emergency_contact_father: student?.emergency_contact_father || '',
    mother_name: student?.mother_name || '',
    mother_education: student?.mother_education || '',
    mother_occupation: student?.mother_occupation || '',
    mother_aadhaar_no: student?.mother_aadhaar_no || '',
    emergency_contact_mother: student?.emergency_contact_mother || '',
    status: student?.status || 'Active',
  };
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proofBusyField, setProofBusyField] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(() => normalizeEditForm(null));
  const [formErrors, setFormErrors] = useState({});
  const [enrollments, setEnrollments] = useState([]);
  const [feesSummary, setFeesSummary] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [proofPreviews, setProofPreviews] = useState({
    photo_path: null,
    father_govt_proof_path: null,
    mother_govt_proof_path: null,
    birth_certificate_path: null,
  });
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfAction, setPdfAction] = useState('');
  const [selectedPdfEnrollmentId, setSelectedPdfEnrollmentId] = useState('');

  const proofInputRefs = useRef({});

  useEffect(() => {
    loadStudentDetail();
  }, [studentId]);

  const totalFee = useMemo(
    () => feesSummary.reduce((sum, row) => sum + Number(row.total_fee || 0), 0),
    [feesSummary],
  );

  const totalPaid = useMemo(
    () => feesSummary.reduce((sum, row) => sum + Number(row.total_paid || 0), 0),
    [feesSummary],
  );

  const totalDue = useMemo(
    () => feesSummary.reduce((sum, row) => sum + normalizeDue(row.pending_balance), 0),
    [feesSummary],
  );

  const enrollmentOptions = useMemo(
    () =>
      enrollments.map((enrollment) => ({
        value: String(enrollment.id),
        label: `${enrollment.year_label || '-'} - ${enrollment.class_name || '-'}`,
      })),
    [enrollments],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!student) {
      return false;
    }
    const baseline = normalizeEditForm(student);
    return JSON.stringify(baseline) !== JSON.stringify(form);
  }, [student, form]);

  async function loadCompanyProfile() {
    const companyResponse = await window.api.company.get();
    if (!companyResponse.success) {
      throw new Error(companyResponse.error || 'Failed to load company profile.');
    }

    const profile = { ...(companyResponse.data || {}) };

    if (profile.logo_path) {
      const logoPrimary = await window.api.student.getPhoto(profile.logo_path);
      if (logoPrimary.success) {
        profile.logo_base64_primary = logoPrimary.data;
      }
    }

    if (profile.logo_path_secondary) {
      const logoSecondary = await window.api.student.getPhoto(profile.logo_path_secondary);
      if (logoSecondary.success) {
        profile.logo_base64_secondary = logoSecondary.data;
      }
    }

    setCompanyProfile(profile);
    return profile;
  }

  async function loadProofPreviews(studentData) {
    const next = {
      photo_path: null,
      father_govt_proof_path: null,
      mother_govt_proof_path: null,
      birth_certificate_path: null,
    };

    for (const proof of PROOF_CONFIG) {
      const proofPath = studentData?.[proof.field];
      if (!proofPath) {
        continue;
      }
      const response = await window.api.student.getPhoto(proofPath);
      if (response.success) {
        next[proof.field] = response.data;
      }
    }

    setProofPreviews(next);
  }

  async function loadStudentDetail() {
    setLoading(true);

    try {
      const id = Number.parseInt(studentId, 10);
      if (!id) {
        throw new Error('Invalid student id.');
      }

      const [studentResponse, enrollmentsResponse, feesResponse] = await Promise.all([
        window.api.student.getById(id),
        window.api.student.getEnrollments(id),
        window.api.student.getFeesSummaryByYear(id),
      ]);

      if (!studentResponse.success) {
        throw new Error(studentResponse.error || 'Failed to load student details.');
      }

      console.log('Enrollments response:', enrollmentsResponse);
      console.log('Fees summary response:', feesResponse);
      console.log('Student response:', studentResponse);

      if (!enrollmentsResponse.success) {
        throw new Error(enrollmentsResponse.error || 'Failed to load enrollment history.');
      }

      if (!feesResponse.success) {
        throw new Error(feesResponse.error || 'Failed to load fees summary.');
      }

      const nextStudent = studentResponse.data || null;

      setStudent(nextStudent);
      setForm(normalizeEditForm(nextStudent));
      setEnrollments(enrollmentsResponse.data || []);
      setFeesSummary(feesResponse.data || []);

      await loadProofPreviews(nextStudent);

      if (!companyProfile) {
        await loadCompanyProfile();
      }
    } catch (error) {
      console.error('[StudentDetail] loadStudentDetail error:', error);
      toast.error(error.message || 'Failed to load student detail.');
      setStudent(null);
      setForm(normalizeEditForm(null));
      setEnrollments([]);
      setFeesSummary([]);
      setProofPreviews({
        photo_path: null,
        father_govt_proof_path: null,
        mother_govt_proof_path: null,
        birth_certificate_path: null,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    const sanitized = ['father_aadhaar_no', 'mother_aadhaar_no'].includes(name)
      ? value.replace(/\D/g, '').slice(0, 12)
      : value;

    setForm((prev) => ({ ...prev, [name]: sanitized }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm() {
    const nextErrors = {};
    const aadhaarRegex = /^\d{12}$/;

    if (!form.student_name?.trim()) {
      nextErrors.student_name = 'Student name is required.';
    }

    if (form.father_aadhaar_no && !aadhaarRegex.test(form.father_aadhaar_no)) {
      nextErrors.father_aadhaar_no = 'Father Aadhaar must be exactly 12 digits.';
    }

    if (form.mother_aadhaar_no && !aadhaarRegex.test(form.mother_aadhaar_no)) {
      nextErrors.mother_aadhaar_no = 'Mother Aadhaar must be exactly 12 digits.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSaveChanges() {
    if (!student?.id) {
      return;
    }
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await window.api.student.update(student.id, {
        ...form,
        student_name: form.student_name.trim(),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update student details.');
      }

      const updatedStudent = response.data;
      setStudent(updatedStudent);
      setForm(normalizeEditForm(updatedStudent));
      setIsEditMode(false);
      toast.success('Student details updated successfully.');
    } catch (error) {
      console.error('[StudentDetail] handleSaveChanges error:', error);
      toast.error(error.message || 'Failed to update student details.');
    } finally {
      setSaving(false);
    }
  }

  function requestCancelEdit() {
    if (!hasUnsavedChanges) {
      setIsEditMode(false);
      setForm(normalizeEditForm(student));
      setFormErrors({});
      return;
    }
    setConfirmDiscardOpen(true);
  }

  function triggerProofUpload(field) {
    proofInputRefs.current[field]?.click();
  }

  async function handleProofFileSelected(field, prefix, event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !student?.id) {
      return;
    }

    setProofBusyField(field);
    try {
      const base64Data = await readFileAsDataURL(file);
      const oldPath = student[field] || '';
      const saveResponse = await window.api.student.savePhoto(base64Data, `${prefix}${file.name}`);
      if (!saveResponse.success) {
        throw new Error(saveResponse.error || 'Failed to save uploaded proof.');
      }

      const newPath = saveResponse.data;
      const updateResponse = await window.api.student.update(student.id, {
        [field]: newPath,
      });
      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to link uploaded proof to student.');
      }

      if (oldPath && oldPath !== newPath) {
        await window.api.student.deletePhoto(oldPath);
      }

      setStudent(updateResponse.data);
      setForm(normalizeEditForm(updateResponse.data));
      setProofPreviews((prev) => ({ ...prev, [field]: base64Data }));

      toast.success('Document updated successfully.');
    } catch (error) {
      console.error('[StudentDetail] handleProofFileSelected error:', error);
      toast.error(error.message || 'Failed to upload document.');
    } finally {
      setProofBusyField('');
    }
  }

  async function handleClearProof(field) {
    if (!student?.id || !student[field]) {
      return;
    }

    setProofBusyField(field);
    try {
      const oldPath = student[field];

      const updateResponse = await window.api.student.update(student.id, {
        [field]: '',
      });
      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to clear proof path.');
      }

      const deleteResponse = await window.api.student.deletePhoto(oldPath);
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.error || 'Failed to delete proof file from disk.');
      }

      setStudent(updateResponse.data);
      setForm(normalizeEditForm(updateResponse.data));
      setProofPreviews((prev) => ({ ...prev, [field]: null }));

      toast.success('Document removed successfully.');
    } catch (error) {
      console.error('[StudentDetail] handleClearProof error:', error);
      toast.error(error.message || 'Failed to remove document.');
    } finally {
      setProofBusyField('');
    }
  }

  function openPdfAction(action) {
    setPdfAction(action);
    setSelectedPdfEnrollmentId('');
    setPdfModalOpen(true);
  }

  function buildStudentPdfData(enrollmentId) {
    const enrollment = enrollments.find((item) => String(item.id) === String(enrollmentId));
    if (!enrollment) {
      throw new Error('Please select an enrollment year.');
    }

    return {
      ...student,
      class_id: enrollment.class_id,
      class_name: enrollment.class_name,
      short_code: enrollment.short_code,
      academic_year_id: enrollment.academic_year_id,
      year_label: enrollment.year_label,
      roll_number: enrollment.roll_number,
      agreed_annual_fee: enrollment.agreed_annual_fee,
      address: student?.address || student?.residential_address || '',
    };
  }

  async function performPdfAction() {
    if (!pdfAction) {
      return;
    }

    setPdfBusy(true);
    try {
      if (!selectedPdfEnrollmentId) {
        throw new Error('Please select enrollment year before continuing.');
      }

      const profile = companyProfile || (await loadCompanyProfile());
      const studentPdfData = buildStudentPdfData(selectedPdfEnrollmentId);

      const blob = await pdf(
        <RegistrationFormPDF
          company={profile}
          student={studentPdfData}
          localPhotoUrl={proofPreviews.photo_path}
        />,
      ).toBlob();

      if (pdfAction === 'download') {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Registration_${student.usin}_${student.student_name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      if (pdfAction === 'print') {
        const arrayBuffer = await blob.arrayBuffer();
        const base64Pdf = toBase64Pdf(arrayBuffer);
        const printResponse = await window.api.student.printPdf(base64Pdf);
        if (!printResponse.success) {
          throw new Error(printResponse.error || 'Failed to send registration PDF to printer.');
        }
      }

      toast.success(
        pdfAction === 'download'
          ? 'Registration PDF downloaded.'
          : 'Registration PDF sent to printer.',
      );
      setPdfModalOpen(false);
      setPdfAction('');
      setSelectedPdfEnrollmentId('');
    } catch (error) {
      console.error('[StudentDetail] performPdfAction error:', error);
      toast.error(error.message || 'Failed to process registration PDF action.');
    } finally {
      setPdfBusy(false);
    }
  }

  const enrollmentColumns = [
    {
      key: 'year_label',
      label: 'Academic Year',
      render: (value) => value || '-',
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value) => value || '-',
    },
    {
      key: 'roll_number',
      label: 'Roll No.',
      render: (value) => value ?? '-',
    },
    {
      key: 'agreed_annual_fee',
      label: 'Agreed Annual Fee',
      render: (value) => toCurrency(value),
    },
  ];

  const feesColumns = [
    {
      key: 'year_label',
      label: 'Academic Year',
      render: (value) => value || '-',
    },
    {
      key: 'class_name',
      label: 'Class',
      render: (value) => value || '-',
    },
    {
      key: 'total_fee',
      label: 'Total Fee',
      render: (value) => toCurrency(value),
    },
    {
      key: 'total_paid',
      label: 'Total Paid',
      render: (value) => toCurrency(value),
    },
    {
      key: 'pending_balance',
      label: 'Pending',
      render: (value) => {
        const pending = normalizeDue(value);
        return (
          <Badge variant={pending > 0 ? 'danger' : 'success'}>
            {toCurrency(pending)}
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Student Detail</h1>
          <p className="text-base text-slate-500 mt-1">
            Edit student master info, manage proofs, and reprint registration form.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/students')}>
            <ArrowLeft size={16} /> Back to Students
          </Button>
          {!isEditMode ? (
            <Button variant="primary" onClick={() => setIsEditMode(true)}>
              <Pencil size={16} /> Edit
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={requestCancelEdit} disabled={saving}>
                <X size={16} /> Cancel
              </Button>
              <Button variant="success" onClick={handleSaveChanges} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="p-8 text-center text-slate-500">Loading student detail...</div>
          </CardBody>
        </Card>
      ) : !student ? (
        <Card>
          <CardBody>
            <div className="p-8 text-center text-slate-500">Student not found.</div>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <User size={15} /> Student
              </div>
              <div className="text-lg font-semibold text-slate-900">{fullName(student)}</div>
              <div className="text-xs text-slate-500 mt-1">USIN: {student.usin || '-'}</div>
              <div className="mt-2">
                <Badge
                  variant={
                    student.status === 'Active'
                      ? 'success'
                      : student.status === 'Alumni'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {student.status || 'Unknown'}
                </Badge>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <GraduationCap size={15} /> Enrollments
              </div>
              <div className="text-2xl font-bold text-slate-900">{enrollments.length}</div>
              <div className="text-xs text-slate-500 mt-1">Across all academic years</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <CircleDollarSign size={15} /> Total Pending
              </div>
              <div className="text-2xl font-bold text-slate-900">{toCurrency(totalDue)}</div>
              <div className="text-xs text-slate-500 mt-1">Historical pending dues</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Master Information</CardTitle>
            </CardHeader>
            <CardBody>
              {isEditMode ? (
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Surname" name="surname" value={form.surname} onChange={handleFormChange} />
                  <Input
                    label="Student Name"
                    name="student_name"
                    value={form.student_name}
                    onChange={handleFormChange}
                    error={formErrors.student_name}
                    required
                  />
                  <Input label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleFormChange} />
                  <Select label="Gender" name="gender" value={form.gender} onChange={handleFormChange} options={GENDER_OPTIONS} />
                  <Input label="Religion" name="religion" value={form.religion} onChange={handleFormChange} />
                  <Input label="Caste" name="caste" value={form.caste} onChange={handleFormChange} />
                  <Input label="Nationality" name="nationality" value={form.nationality} onChange={handleFormChange} />
                  <Input label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleFormChange} />
                  <Input label="Mother Tongue" name="mother_tongue" value={form.mother_tongue} onChange={handleFormChange} />
                  <Input label="Father Name" name="father_name" value={form.father_name} onChange={handleFormChange} />
                  <Input label="Father Education" name="father_education" value={form.father_education} onChange={handleFormChange} />
                  <Input label="Father Occupation" name="father_occupation" value={form.father_occupation} onChange={handleFormChange} />
                  <Input
                    label="Father Aadhaar"
                    name="father_aadhaar_no"
                    value={form.father_aadhaar_no}
                    onChange={handleFormChange}
                    error={formErrors.father_aadhaar_no}
                  />
                  <Input
                    label="Father Emergency Contact"
                    name="emergency_contact_father"
                    value={form.emergency_contact_father}
                    onChange={handleFormChange}
                  />
                  <Input label="Mother Name" name="mother_name" value={form.mother_name} onChange={handleFormChange} />
                  <Input label="Mother Education" name="mother_education" value={form.mother_education} onChange={handleFormChange} />
                  <Input label="Mother Occupation" name="mother_occupation" value={form.mother_occupation} onChange={handleFormChange} />
                  <Input
                    label="Mother Aadhaar"
                    name="mother_aadhaar_no"
                    value={form.mother_aadhaar_no}
                    onChange={handleFormChange}
                    error={formErrors.mother_aadhaar_no}
                  />
                  <Input
                    label="Mother Emergency Contact"
                    name="emergency_contact_mother"
                    value={form.emergency_contact_mother}
                    onChange={handleFormChange}
                  />
                  <Select label="Status" name="status" value={form.status} onChange={handleFormChange} options={STATUS_OPTIONS} />
                  <div className="col-span-3">
                    <Textarea label="Address" name="address" value={form.address} onChange={handleFormChange} rows={3} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500">Date of Birth</div>
                    <div className="font-medium text-slate-900">{student.dob || '-'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Gender</div>
                    <div className="font-medium text-slate-900">{student.gender || '-'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Admission Date</div>
                    <div className="font-medium text-slate-900">{student.admission_date || '-'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Father Name</div>
                    <div className="font-medium text-slate-900">{student.father_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Mother Name</div>
                    <div className="font-medium text-slate-900">{student.mother_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Contact (Father)</div>
                    <div className="font-medium text-slate-900">{student.emergency_contact_father || '-'}</div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-slate-500">Address</div>
                    <div className="font-medium text-slate-900">{student.address || '-'}</div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Proofs</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                {PROOF_CONFIG.map((proof) => {
                  const preview = proofPreviews[proof.field];
                  const hasFile = Boolean(student?.[proof.field]);
                  const busy = proofBusyField === proof.field;

                  return (
                    <div key={proof.field} className="border border-slate-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-slate-900 mb-3">{proof.label}</div>
                      <div className="h-40 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-center overflow-hidden mb-3">
                        {preview ? (
                          <img src={preview} alt={proof.label} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs text-slate-500">No document uploaded</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(element) => {
                            proofInputRefs.current[proof.field] = element;
                          }}
                          onChange={(event) => handleProofFileSelected(proof.field, proof.prefix, event)}
                        />
                        <Button variant="secondary" size="sm" onClick={() => triggerProofUpload(proof.field)} disabled={busy}>
                          <Upload size={14} /> {busy ? 'Uploading...' : hasFile ? 'Replace' : 'Upload'}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleClearProof(proof.field)} disabled={!hasFile || busy}>
                          <Trash2 size={14} /> Clear
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration PDF</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Reprint or download registration form. Enrollment year selection is required every time.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openPdfAction('download')} disabled={pdfBusy || enrollments.length === 0}>
                    <Download size={16} /> Download
                  </Button>
                  <Button variant="primary" onClick={() => openPdfAction('print')} disabled={pdfBusy || enrollments.length === 0}>
                    <Printer size={16} /> Reprint
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment History</CardTitle>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              <Table
                columns={enrollmentColumns}
                data={enrollments}
                emptyMessage="No enrollment history found."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Year-wise Fee Summary</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Total Fee</div>
                  <div className="font-semibold text-slate-900">{toCurrency(totalFee)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Total Paid</div>
                  <div className="font-semibold text-slate-900">{toCurrency(totalPaid)}</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Total Pending</div>
                  <div className="font-semibold text-slate-900">{toCurrency(totalDue)}</div>
                </div>
              </div>

              <Table
                columns={feesColumns}
                data={feesSummary}
                emptyMessage="No fee summary found for this student."
              />
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        isOpen={pdfModalOpen}
        onClose={() => {
          if (pdfBusy) {
            return;
          }
          setPdfModalOpen(false);
          setPdfAction('');
          setSelectedPdfEnrollmentId('');
        }}
        title={pdfAction === 'download' ? 'Download Registration PDF' : 'Print Registration PDF'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (pdfBusy) {
                  return;
                }
                setPdfModalOpen(false);
                setPdfAction('');
                setSelectedPdfEnrollmentId('');
              }}
              disabled={pdfBusy}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={performPdfAction} disabled={pdfBusy || !selectedPdfEnrollmentId}>
              {pdfBusy ? 'Processing...' : pdfAction === 'download' ? 'Download' : 'Print'}
            </Button>
          </>
        }
      >
        <Select
          label="Select Enrollment Year"
          name="selectedPdfEnrollmentId"
          value={selectedPdfEnrollmentId}
          onChange={(event) => setSelectedPdfEnrollmentId(event.target.value)}
          options={enrollmentOptions}
          placeholder="Choose academic year"
          required
        />
      </Modal>

      <ConfirmModal
        isOpen={confirmDiscardOpen}
        title="Discard unsaved changes?"
        message="Your edits will be lost if you cancel now."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmVariant="danger"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          setIsEditMode(false);
          setForm(normalizeEditForm(student));
          setFormErrors({});
        }}
      />
    </div>
  );
}
