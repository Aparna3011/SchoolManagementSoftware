import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Camera, Upload, X, UserPlus, RefreshCw } from 'lucide-react';
import Webcam from 'react-webcam';
import { pdf } from '@react-pdf/renderer';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RegistrationFormPDF } from '../components/pdf/RegistrationFormPDF';
import { toast } from 'react-toastify';

const INITIAL_FORM = {
  surname: '',
  student_name: '',
  father_first_name: '',
  dob: '',
  class_id: '',
  section_id: '',
  roll_number: '',
  agreed_annual_fee: '',
  religion: '',
  caste: '',
  nationality: '',
  address: '',
  father_name: '',
  father_education: '',
  father_occupation: '',
  father_aadhaar_no: '',
  mother_name: '',
  mother_education: '',
  mother_occupation: '',
  mother_aadhaar_no: '',
  mother_tongue: '',
  emergency_contact_mother: '',
  emergency_contact_father: '',
};

export default function Registration() {
  const { execute, loading } = useDatabase();

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [classes, setClasses] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [previewUSIN, setPreviewUSIN] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoPath, setPhotoPath] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [fatherGovtProofPreview, setFatherGovtProofPreview] = useState(null);
  const [fatherGovtProofPath, setFatherGovtProofPath] = useState('');
  const [fatherGovtProofFileName, setFatherGovtProofFileName] = useState('');
  const [motherGovtProofPreview, setMotherGovtProofPreview] = useState(null);
  const [motherGovtProofPath, setMotherGovtProofPath] = useState('');
  const [motherGovtProofFileName, setMotherGovtProofFileName] = useState('');
  const [birthCertificatePreview, setBirthCertificatePreview] = useState(null);
  const [birthCertificatePath, setBirthCertificatePath] = useState('');
  const [birthCertificateFileName, setBirthCertificateFileName] = useState('');
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [emptyFormLoading, setEmptyFormLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewInitialized, setPreviewInitialized] = useState(false);

  const isDevMode = import.meta.env.DEV;

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  useEffect(() => {
    if (!isDevMode || previewInitialized) return;

    if (!companyProfile) return;

    handleRefreshPreview();
    setPreviewInitialized(true);
  }, [isDevMode, previewInitialized, companyProfile]);

  useEffect(() => {
    async function updateUSINPreview() {
      if (!activeYear?.id || !form.class_id) {
        setPreviewUSIN('');
        return;
      }
      const usin = await execute(() =>
        window.api.student.generateUSIN(activeYear.id, Number.parseInt(form.class_id, 10)),
      );
      if (usin) {
        setPreviewUSIN(usin);
      }
    }

    updateUSINPreview();
  }, [activeYear?.id, form.class_id]);

  async function loadFormData() {
    const year = await execute(() => window.api.financialYear.getActive());
    if (year) {
      setActiveYear(year);
    }

    const classList = await execute(() => window.api.class.getAll());
    if (classList) {
      setClasses(classList);
    }

    const profile = await execute(() => window.api.company.get());
    if (profile) {
      if (profile.logo_path) {
        const photoResult = await execute(() => window.api.student.getPhoto(profile.logo_path));
        if (photoResult) {
          profile.logo_base64_primary = photoResult;

        }
      }
      if (profile.logo_path_secondary) {
        const photoResultSec = await execute(() => window.api.student.getPhoto(profile.logo_path_secondary));
        if (photoResultSec) {
          profile.logo_base64_secondary = photoResultSec;

        } else { profile.logo_base64_secondary = null; }
      }
      setCompanyProfile(profile);
      console.log('company', profile)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    const sanitizedValue = ['father_aadhaar_no', 'mother_aadhaar_no'].includes(name)
      ? value.replace(/\D/g, '').slice(0, 12)
      : value;

    setForm((prev) => {
      const updated = { ...prev, [name]: sanitizedValue };

      if (name === 'class_id') {
        const selectedClass = classes.find((c) => c.id.toString() === sanitizedValue);
        if (selectedClass) {
          updated.agreed_annual_fee = selectedClass.base_fee || '';
        } else {
          updated.agreed_annual_fee = '';
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setPhotoPreview(base64);
      setPhotoPath('');
      setPhotoFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setPhotoPreview(imageSrc);
    setPhotoPath('');
    setPhotoFileName('webcam_capture.jpg');
    setWebcamOpen(false);
  }, [webcamRef, execute]);

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoPath('');
    setPhotoFileName('');
  }

  function clearDocumentPhoto(setPreview, setPath, setFileName) {
    setPreview(null);
    setPath('');
    setFileName('');
  }

  function resetRegistrationForm() {
    setForm({ ...INITIAL_FORM });
    setPreviewUSIN('');
    setPhotoPreview(null);
    setPhotoPath('');
    setPhotoFileName('');
    setFatherGovtProofPreview(null);
    setFatherGovtProofPath('');
    setFatherGovtProofFileName('');
    setMotherGovtProofPreview(null);
    setMotherGovtProofPath('');
    setMotherGovtProofFileName('');
    setBirthCertificatePreview(null);
    setBirthCertificatePath('');
    setBirthCertificateFileName('');
    setErrors({});
  }

  function uploadDocumentPhoto(file, setPreview, setPath, setFileName) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setPreview(base64);
      setPath('');
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function persistPhotoOnComplete(preview, currentPath, fileNameWithPrefix, label) {
    if (currentPath) {
      return currentPath;
    }

    if (!preview) {
      return '';
    }

    const savedPath = await execute(() => window.api.student.savePhoto(preview, fileNameWithPrefix));
    if (!savedPath) {
      throw new Error(`Failed to save ${label}.`);
    }

    return savedPath;
  }

  function handleFatherGovtProofUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocumentPhoto(file, setFatherGovtProofPreview, setFatherGovtProofPath, setFatherGovtProofFileName);
  }

  function handleMotherGovtProofUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocumentPhoto(file, setMotherGovtProofPreview, setMotherGovtProofPath, setMotherGovtProofFileName);
  }

  function handleBirthCertificateUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadDocumentPhoto(file, setBirthCertificatePreview, setBirthCertificatePath, setBirthCertificateFileName);
  }

  function validateForm() {
    const newErrors = {};
    const aadhaarRegex = /^\d{12}$/;

    if (!form.student_name.trim()) {
      newErrors.student_name = 'Student name is required.';
    }
    if (!activeYear?.id) {
      newErrors.year = 'Active academic year is required.';
    }
    if (!form.class_id) {
      newErrors.class_id = 'Class is required.';
    }
    if (form.father_aadhaar_no && !aadhaarRegex.test(form.father_aadhaar_no)) {
      newErrors.father_aadhaar_no = 'Father Aadhaar must be exactly 12 digits.';
    }
    if (form.mother_aadhaar_no && !aadhaarRegex.test(form.mother_aadhaar_no)) {
      newErrors.mother_aadhaar_no = 'Mother Aadhaar must be exactly 12 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function createAdmissionPdfBlob(createdStudent) {
    return pdf(
      <RegistrationFormPDF
        company={companyProfile}
        student={{ ...createdStudent, father_first_name: form.father_first_name }}
        localPhotoUrl={photoPreview}
      />,
    ).toBlob();
  }

  async function handleComplete(action = 'complete') {
    if (!validateForm()) return;

    setActionLoading(action);

    try {
      const resolvedPhotoPath = await persistPhotoOnComplete(
        photoPreview,
        photoPath,
        `student_profile_${photoFileName || 'webcam_capture.jpg'}`,
        'student profile photo',
      );

      const resolvedFatherProofPath = await persistPhotoOnComplete(
        fatherGovtProofPreview,
        fatherGovtProofPath,
        `father_govt_proof_${fatherGovtProofFileName || 'upload.jpg'}`,
        'father government proof',
      );

      const resolvedMotherProofPath = await persistPhotoOnComplete(
        motherGovtProofPreview,
        motherGovtProofPath,
        `mother_govt_proof_${motherGovtProofFileName || 'upload.jpg'}`,
        'mother government proof',
      );

      const resolvedBirthCertificatePath = await persistPhotoOnComplete(
        birthCertificatePreview,
        birthCertificatePath,
        `birth_certificate_${birthCertificateFileName || 'upload.jpg'}`,
        'birth certificate',
      );

      const payload = {
        ...form,
        father_aadhaar_no: form.father_aadhaar_no.trim(),
        mother_aadhaar_no: form.mother_aadhaar_no.trim(),
        class_id: Number.parseInt(form.class_id, 10),
        section_id: form.section_id ? Number.parseInt(form.section_id, 10) : null,
        roll_number: form.roll_number ? Number.parseInt(form.roll_number, 10) : null,
        agreed_annual_fee: form.agreed_annual_fee ? Number.parseFloat(form.agreed_annual_fee) : 0,
        photo_path: resolvedPhotoPath,
        father_govt_proof_path: resolvedFatherProofPath,
        mother_govt_proof_path: resolvedMotherProofPath,
        birth_certificate_path: resolvedBirthCertificatePath,
        academic_year_id: activeYear.id,
      };

      const created = await execute(() => window.api.student.create(payload));

      if (created) {
        setSuccessMessage(`Student "${created.student_name}" registered successfully! (USIN: ${created.usin})`);

        try {
          if (action === 'download' || action === 'print') {
            const blob = await createAdmissionPdfBlob(created);

            if (action === 'download') {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Admission_${created.usin}_${created.student_name}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }

            if (action === 'print') {
              const arrayBuffer = await blob.arrayBuffer();
              const binary = new Uint8Array(arrayBuffer);
              let binaryString = '';
              for (let i = 0; i < binary.length; i += 1) {
                binaryString += String.fromCharCode(binary[i]);
              }
              const base64Pdf = btoa(binaryString);
              const printed = await execute(() => window.api.student.printPdf(base64Pdf));
              if (!printed) {
                throw new Error('Failed to send admission form to the default printer.');
              }
            }
          }
        } catch (err) {
          console.error('Failed to process admission PDF action:', err);
        }

        resetRegistrationForm();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Failed to complete registration:', err);
      toast.error(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setActionLoading('');
    }
  }

  async function handleDownloadEmptyForm() {
    try {
      setEmptyFormLoading(true);

      const emptyBlob = await pdf(
        <RegistrationFormPDF
          company={companyProfile}
          student={{}}
          localPhotoUrl={null}
          isEmpty={true}
        />,
      ).toBlob();

      const url = URL.createObjectURL(emptyBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'empty_admission_form.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate empty form PDF:', err);
    } finally {
      setEmptyFormLoading(false);
    }
  }

  async function handleRefreshPreview() {
    try {
      setPreviewLoading(true);

      const selectedClass = classes.find((c) => c.id.toString() === form.class_id);
      const previewStudent = {
        ...form,
        usin: previewUSIN,
        class_name: selectedClass ? selectedClass.class_name : '',
      };

      console.log('Preview student data:', previewStudent);

      const blob = await pdf(
        <RegistrationFormPDF
          company={companyProfile}
          student={previewStudent}
          localPhotoUrl={photoPreview}
        />,
      ).toBlob();

      const nextUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return nextUrl;
      });
    } catch (err) {
      console.error('Failed to generate preview PDF:', err);
    } finally {
      setPreviewLoading(false);
    }
  }

  const classOptions = classes.map((c) => ({
    value: c.id.toString(),
    label: `${c.class_name} (${c.short_code})`,
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Student Registration</h1>
          <p className="text-base text-slate-500 mt-1">
            Admission Form
            {activeYear && <span> - Academic Year: {activeYear.year_label}</span>}
          </p>
        </div>
        <div className='flex gap-10'>
          <Button
            type="button"
            variant="danger"
            disabled={emptyFormLoading}
            onClick={(e) => {
              e.preventDefault();
              resetRegistrationForm();
              toast.info('Form cleared. You can start fresh now.');
            }}
          >
            Clear Form
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={emptyFormLoading}
            onClick={handleDownloadEmptyForm}
          >
            {emptyFormLoading ? 'Preparing PDF...' : 'Print Empty Form'}
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-4 mb-6 text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-lg">
          <UserPlus size={18} />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errors.year && (
        <div className="p-3 mb-4 text-amber-800 bg-amber-100 border border-amber-200 rounded-md text-sm">
          {errors.year}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-3 gap-6">
          <div style={{ gridColumn: 'span 2' }} className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      label="USIN"
                      name="usin"
                      value={previewUSIN}
                      onChange={() => { }}
                      hint="Auto-generated"
                      disabled
                    />
                    <div className="col-span-3">
                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          label="Surname"
                          name="surname"
                          value={form.surname}
                          onChange={handleChange}
                          placeholder="Surname"
                        />
                        <Input
                          label="Student Name"
                          name="student_name"
                          value={form.student_name}
                          onChange={handleChange}
                          placeholder="Student's name"
                          required
                          error={errors.student_name}
                        />
                        <Input
                          label="Father's Name"
                          name="father_first_name"
                          value={form.father_first_name}
                          onChange={handleChange}
                          placeholder="Father's first name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      value={form.dob}
                      onChange={handleChange}
                    />
                    <Select
                      label="Class"
                      name="class_id"
                      value={form.class_id}
                      onChange={handleChange}
                      options={classOptions}
                      placeholder="Select class..."
                      required
                      error={errors.class_id}
                    />
                    <Input
                      label="Agreed Annual Fee"
                      name="agreed_annual_fee"
                      type="number"
                      value={form.agreed_annual_fee}
                      onChange={handleChange}
                      placeholder="e.g. 5000"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Religion"
                      name="religion"
                      value={form.religion}
                      onChange={handleChange}
                      placeholder="Religion"
                    />
                    <Input
                      label="Caste"
                      name="caste"
                      value={form.caste}
                      onChange={handleChange}
                      placeholder="Caste"
                    />
                    <Input
                      label="Nationality"
                      name="nationality"
                      value={form.nationality}
                      onChange={handleChange}
                      placeholder="e.g., Indian"
                    />
                  </div>

                  <Textarea
                    label="Residential Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Full residential address..."
                    rows={2}
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Birth Certificate</p>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md overflow-hidden flex items-center justify-center bg-slate-50">
                        {birthCertificatePreview ? (
                          <img src={birthCertificatePreview} alt="Birth certificate" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[11px] text-slate-500 text-center px-1">No image</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center justify-center gap-2 px-3 py-1 text-xs font-medium rounded-md bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-colors">
                          <Upload size={14} />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBirthCertificateUpload}
                            className="hidden"
                          />
                        </label>
                        {birthCertificatePreview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearDocumentPhoto(setBirthCertificatePreview, setBirthCertificatePath, setBirthCertificateFileName)}
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Father's Details</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label="Name of the Father (in full)"
                    name="father_name"
                    value={form.father_name}
                    onChange={handleChange}
                    placeholder="Father's full name"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Father's Education"
                      name="father_education"
                      value={form.father_education}
                      onChange={handleChange}
                      placeholder="e.g., Graduate, Post Graduate"
                    />
                    <Input
                      label="Father's Occupation"
                      name="father_occupation"
                      value={form.father_occupation}
                      onChange={handleChange}
                      placeholder="e.g., Business, Service"
                    />
                  </div>
                  <Input
                    label="Father's Aadhaar Number"
                    name="father_aadhaar_no"
                    value={form.father_aadhaar_no}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar number"
                    inputMode="numeric"
                    maxLength={12}
                    error={errors.father_aadhaar_no}
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Father Government Proof</p>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md overflow-hidden flex items-center justify-center bg-slate-50">
                        {fatherGovtProofPreview ? (
                          <img src={fatherGovtProofPreview} alt="Father government proof" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[11px] text-slate-500 text-center px-1">No image</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center justify-center gap-2 px-3 py-1 text-xs font-medium rounded-md bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-colors">
                          <Upload size={14} />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFatherGovtProofUpload}
                            className="hidden"
                          />
                        </label>
                        {fatherGovtProofPreview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearDocumentPhoto(setFatherGovtProofPreview, setFatherGovtProofPath, setFatherGovtProofFileName)}
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mother's Details</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label="Name of the Mother (in full)"
                    name="mother_name"
                    value={form.mother_name}
                    onChange={handleChange}
                    placeholder="Mother's full name"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Mother's Education"
                      name="mother_education"
                      value={form.mother_education}
                      onChange={handleChange}
                      placeholder="e.g., Graduate, Post Graduate"
                    />
                    <Input
                      label="Mother's Occupation"
                      name="mother_occupation"
                      value={form.mother_occupation}
                      onChange={handleChange}
                      placeholder="e.g., Homemaker, Teacher"
                    />
                  </div>
                  <Input
                    label="Mother's Aadhaar Number"
                    name="mother_aadhaar_no"
                    value={form.mother_aadhaar_no}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar number"
                    inputMode="numeric"
                    maxLength={12}
                    error={errors.mother_aadhaar_no}
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Mother Government Proof</p>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md overflow-hidden flex items-center justify-center bg-slate-50">
                        {motherGovtProofPreview ? (
                          <img src={motherGovtProofPreview} alt="Mother government proof" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[11px] text-slate-500 text-center px-1">No image</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center justify-center gap-2 px-3 py-1 text-xs font-medium rounded-md bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-colors">
                          <Upload size={14} />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleMotherGovtProofUpload}
                            className="hidden"
                          />
                        </label>
                        {motherGovtProofPreview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearDocumentPhoto(setMotherGovtProofPreview, setMotherGovtProofPath, setMotherGovtProofFileName)}
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label="Mother Tongue"
                    name="mother_tongue"
                    value={form.mother_tongue}
                    onChange={handleChange}
                    placeholder="e.g., Marathi, Hindi"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Emergency Contact - Mother"
                      name="emergency_contact_mother"
                      value={form.emergency_contact_mother}
                      onChange={handleChange}
                      placeholder="Mother's mobile number"
                    />
                    <Input
                      label="Emergency Contact - Father"
                      name="emergency_contact_father"
                      value={form.emergency_contact_father}
                      onChange={handleChange}
                      placeholder="Father's mobile number"
                    />
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={loading || !!actionLoading}
                  onClick={() => handleComplete('complete')}
                >
                  <Save size={18} />
                  {actionLoading === 'complete' ? 'Completing...' : 'Complete'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  disabled={loading || !!actionLoading}
                  onClick={() => handleComplete('print')}
                >
                  <Save size={18} />
                  {actionLoading === 'print' ? 'Printing...' : 'Complete and Print'}
                </Button>
                <Button
                  type="button"
                  variant="success"
                  size="lg"
                  disabled={loading || !!actionLoading}
                  onClick={() => handleComplete('download')}
                >
                  <Save size={18} />
                  {actionLoading === 'download' ? 'Downloading...' : 'Complete and Download'}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Student Photo</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-3/4 max-w-50 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden flex flex-col items-center justify-center bg-slate-50 relative">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Student photo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={32} className="text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">No photo</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 justify-center w-full">
                    <label className="inline-flex items-center justify-center gap-2 px-3 py-1 text-xs font-medium rounded-md bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-colors">
                      <Upload size={14} />
                      Upload
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setWebcamOpen(true)}
                    >
                      <Camera size={14} />
                      Capture
                    </Button>
                    {photoPreview && (
                      <Button variant="ghost" size="sm" onClick={clearPhoto}>
                        <X size={14} />
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted text-center">
                    Upload or capture a passport-size photo
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="mt-4">
              <CardBody>
                <div className="text-sm text-secondary">
                  <p className="font-semibold mb-2">Admission Form Info</p>
                  <ul className="pl-4 list-disc space-y-1 mt-2 text-slate-600">
                    <li>USIN is auto-generated by year and class code</li>
                    <li>Student Name and Class are required</li>
                    <li>Photo can be added later</li>
                    <li>Agreed Annual Fee is auto-filled by Class but can be edited</li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>

      <Modal
        isOpen={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        title="Capture Photo"
        maxWidth="450px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWebcamOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={capturePhoto}>
              <Camera size={16} /> Capture
            </Button>
          </>
        }
      >
        <div className="webcam-container">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.8}
            videoConstraints={{
              width: 400,
              height: 480,
              facingMode: 'user',
            }}
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      </Modal>

      {isDevMode && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admission Form Preview (Development)</CardTitle>
            {isDevMode && (
              <Button
                type="button"
                variant="primary"
                disabled={previewLoading}
                onClick={handleRefreshPreview}
              >
                <RefreshCw size={14} />
                {previewLoading ? 'Refreshing Preview...' : 'Refresh Preview'}
              </Button>
            )}
          </CardHeader>
          <CardBody>

            <div className="w-full h-[75vh]">
              {previewLoading && (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  Refreshing PDF preview...
                </div>
              )}
              {!previewLoading && previewPdfUrl && (
                <iframe
                  title="Registration PDF Preview"
                  src={previewPdfUrl}
                  className="w-full h-[1400px] border border-slate-200 rounded-md"
                />
              )}
              {!previewLoading && !previewPdfUrl && (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  Preview could not be generated.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
