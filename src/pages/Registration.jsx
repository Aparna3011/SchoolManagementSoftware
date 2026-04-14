import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Camera, Upload, X, RotateCcw, UserPlus } from 'lucide-react';
import Webcam from 'react-webcam';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RegistrationFormPDF } from '../components/pdf/RegistrationFormPDF';

/**
 * Registration Page
 * 
 * Detailed admission form matching the paper form layout:
 * - Student info (Sr.No, Surname, Name, Father's Name, DOB)
 * - Class selection
 * - Religion, Caste, Address
 * - Father details (Name, Education, Occupation)
 * - Mother details (Name, Education, Occupation)
 * - Mother Tongue
 * - Emergency contacts
 * - Photo capture/upload
 */

const INITIAL_FORM = {
  sr_no: '',
  surname: '',
  student_name: '',
  father_first_name: '',
  dob: '',
  class_id: '',
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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoPath, setPhotoPath] = useState('');
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const [companyProfile, setCompanyProfile] = useState(null);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFormData();
  }, []);

  async function loadFormData() {
    // Load active year
    const year = await execute(() => window.api.financialYear.getActive());
    if (year) {
      setActiveYear(year);

      // Load classes for this year
      const classList = await execute(() => window.api.class.getAll(year.id));
      if (classList) setClasses(classList);
    }

    // Get next serial number
    const nextSrNo = await execute(() => window.api.student.getNextSrNo());
    if (nextSrNo) {
      setForm((prev) => ({ ...prev, sr_no: nextSrNo }));
    }

    // Load company profile for PDF
    const profile = await execute(() => window.api.company.get());
    if (profile) setCompanyProfile(profile);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  // ---- Photo Handling ----

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setPhotoPreview(base64);

      // Save to AppData
      const savedPath = await execute(() =>
        window.api.student.savePhoto(base64, file.name)
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

    // Save to AppData
    const savedPath = await execute(() =>
      window.api.student.savePhoto(imageSrc, 'webcam_capture.jpg')
    );
    if (savedPath) setPhotoPath(savedPath);
  }, [webcamRef, execute]);

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoPath('');
  }

  // ---- Form Validation ----

  function validateForm() {
    const newErrors = {};

    if (!form.student_name.trim()) {
      newErrors.student_name = 'Student name is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---- Form Submit ----

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...form,
      class_id: form.class_id ? parseInt(form.class_id, 10) : null,
      photo_path: photoPath,
      year_id: activeYear?.id || null,
    };

    const created = await execute(() => window.api.student.create(payload));

    if (created) {
      setSuccessMessage(`Student "${created.student_name}" registered successfully! (Sr. No: ${created.sr_no})`);

      // Reset form
      setForm({ ...INITIAL_FORM });
      setPhotoPreview(null);
      setPhotoPath('');
      setErrors({});

      // Reload next sr_no
      const nextSrNo = await execute(() => window.api.student.getNextSrNo());
      if (nextSrNo) {
        setForm((prev) => ({ ...prev, sr_no: nextSrNo }));
      }

      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }

  // ---- Class options ----
  const classOptions = classes.map((c) => ({
    value: c.id.toString(),
    label: `${c.class_name}${c.session_time ? ` (${c.session_time})` : ''}`,
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Student Registration</h1>
          <p className="text-base text-slate-500 mt-1">
            Admission Form
            {activeYear && <span> — Financial Year: {activeYear.year_label}</span>}
          </p>
        </div>
        <div>
          <PDFDownloadLink
            document={<RegistrationFormPDF company={companyProfile} isEmpty={true} />}
            fileName="empty_admission_form.pdf"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            {({ loading }) => (loading ? 'Preparing PDF...' : 'Print Empty Form')}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 mb-6 text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-lg">
          <UserPlus size={18} />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Main Form (2 columns) */}
          <div style={{ gridColumn: 'span 2' }} className="flex flex-col gap-6">

            {/* Section 1: Student Information */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  {/* Row 1: Sr.No */}
                  <div className="grid grid-cols-4 gap-4">
                    <Input
                      label="Sr. No"
                      name="sr_no"
                      value={form.sr_no}
                      onChange={handleChange}
                      hint="Auto-generated"
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

                  {/* Row 2: DOB, Class */}
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
                    />
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
                  </div>

                  {/* Row 3: Address */}
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

            {/* Section 2: Father's Details */}
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

            {/* Section 3: Mother's Details */}
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

            {/* Section 4: Additional Info */}
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
                      label="Emergency Contact — Mother"
                      name="emergency_contact_mother"
                      value={form.emergency_contact_mother}
                      onChange={handleChange}
                      placeholder="Mother's mobile number"
                    />
                    <Input
                      label="Emergency Contact — Father"
                      name="emergency_contact_father"
                      value={form.emergency_contact_father}
                      onChange={handleChange}
                      placeholder="Father's mobile number"
                    />
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Register Student'}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right: Photo Upload (1 column) */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Student Photo</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col items-center gap-4">
                  {/* Preview */}
                  <div className="w-full aspect-[3/4] max-w-[200px] border-2 border-dashed border-slate-300 rounded-lg overflow-hidden flex flex-col items-center justify-center bg-slate-50 relative">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Student photo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={32} className="text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">No photo</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
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

            {/* Info Card */}
            <Card className="mt-4">
              <CardBody>
                <div className="text-sm text-secondary">
                  <p className="font-semibold mb-2">Admission Form Info</p>
                  <ul className="pl-4 list-disc space-y-1 mt-2 text-slate-600">
                    <li>Sr. No is auto-generated</li>
                    <li>Only Student Name is required</li>
                    <li>Photo can be added later</li>
                    <li>Class fee will be set from Master Settings</li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>

      {/* Webcam Modal */}
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
