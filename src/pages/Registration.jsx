import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Camera, Upload, X, UserPlus } from 'lucide-react';
import Webcam from 'react-webcam';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RegistrationFormPDF } from '../components/pdf/RegistrationFormPDF';

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
  address: '',
  father_name: '',
  father_education: '',
  father_occupation: '',
  mother_name: '',
  mother_education: '',
  mother_occupation: '',
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
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [companyProfile, setCompanyProfile] = useState(null);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFormData();
  }, []);

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
          profile.logo_base64 = photoResult;
        }
      }
      setCompanyProfile(profile);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'class_id') {
        const selectedClass = classes.find((c) => c.id.toString() === value);
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

      const savedPath = await execute(() =>
        window.api.student.savePhoto(base64, file.name),
      );
      if (savedPath) setPhotoPath(savedPath);
    };
    reader.readAsDataURL(file);
  }

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setPhotoPreview(imageSrc);
    setWebcamOpen(false);

    const savedPath = await execute(() =>
      window.api.student.savePhoto(imageSrc, 'webcam_capture.jpg'),
    );
    if (savedPath) setPhotoPath(savedPath);
  }, [webcamRef, execute]);

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoPath('');
  }

  function validateForm() {
    const newErrors = {};

    if (!form.student_name.trim()) {
      newErrors.student_name = 'Student name is required.';
    }
    if (!activeYear?.id) {
      newErrors.year = 'Active academic year is required.';
    }
    if (!form.class_id) {
      newErrors.class_id = 'Class is required.';
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

    const payload = {
      ...form,
      class_id: Number.parseInt(form.class_id, 10),
      section_id: form.section_id ? Number.parseInt(form.section_id, 10) : null,
      roll_number: form.roll_number ? Number.parseInt(form.roll_number, 10) : null,
      agreed_annual_fee: form.agreed_annual_fee ? Number.parseFloat(form.agreed_annual_fee) : 0,
      photo_path: photoPath,
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

      setForm({ ...INITIAL_FORM });
      setPreviewUSIN('');
      setPhotoPreview(null);
      setPhotoPath('');
      setErrors({});
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    setActionLoading('');
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
        <div>
          <PDFDownloadLink
            document={<RegistrationFormPDF company={companyProfile} student={{}} localPhotoUrl={null} isEmpty={true} />}
            fileName="empty_admission_form.pdf"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            {({ loading: preparing }) => (preparing ? 'Preparing PDF...' : 'Print Empty Form')}
          </PDFDownloadLink>
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
                      onChange={() => {}}
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

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <Textarea
                    label="Residential Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Full residential address..."
                    rows={2}
                  />
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
    </div>
  );
}
