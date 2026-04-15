import { useState, useEffect } from 'react';
import { Save, Upload, Building2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

/**
 * Company Profile Page
 *
 * Extended form for institute identity, contact, statutory details, and logo.
 * Singleton row - always updates id=1.
 */

const INITIAL_FORM = {
  firm_name: '',
  group_name: '',
  school_name: '',
  branch_name: '',
  principal_name: '',
  contact_person: '',
  tagline: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  phone: '',
  alt_phone: '',
  email: '',
  website: '',
  registration_no: '',
  udise_no: '',
  affiliation_no: '',
  gstin: '',
  logo_path: '',
};

export default function CompanyProfile() {
  const { execute, loading } = useDatabase();

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const profile = await execute(() => window.api.company.get());
    if (profile) {
      setForm({
        firm_name: profile.firm_name || '',
        group_name: profile.group_name || '',
        school_name: profile.school_name || '',
        branch_name: profile.branch_name || '',
        principal_name: profile.principal_name || '',
        contact_person: profile.contact_person || '',
        tagline: profile.tagline || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        country: profile.country || 'India',
        phone: profile.phone || '',
        alt_phone: profile.alt_phone || '',
        email: profile.email || '',
        website: profile.website || '',
        registration_no: profile.registration_no || '',
        udise_no: profile.udise_no || '',
        affiliation_no: profile.affiliation_no || '',
        gstin: profile.gstin || '',
        logo_path: profile.logo_path || '',
      });

      if (profile.logo_path) {
        const photoResult = await execute(() => window.api.student.getPhoto(profile.logo_path));
        if (photoResult) {
          setLogoPreview(photoResult);
        }
      }
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setLogoPreview(base64);

      const savedPath = await execute(() =>
        window.api.student.savePhoto(base64, `logo_${file.name}`)
      );

      if (savedPath) {
        setForm((prev) => ({ ...prev, logo_path: savedPath }));
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleSave() {
    await execute(() => window.api.company.update(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Company Profile</h1>
        <p className="text-base text-slate-500 mt-1">Manage institute identity, contacts, and statutory details</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div style={{ gridColumn: 'span 2' }}>
          <Card>
            <CardHeader>
              <CardTitle>Institution Information</CardTitle>
            </CardHeader>

            <CardBody>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-semibold text-slate-700">Identity</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Group Name"
                      name="group_name"
                      value={form.group_name}
                      onChange={handleChange}
                      placeholder="e.g., Group of Institutions"
                    />
                    <Input
                      label="Firm Name"
                      name="firm_name"
                      value={form.firm_name}
                      onChange={handleChange}
                      placeholder="e.g., Rainbow Play School"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="School Name"
                      name="school_name"
                      value={form.school_name}
                      onChange={handleChange}
                      placeholder="e.g., Rainbow Pre Primary School"
                    />
                    <Input
                      label="Branch Name"
                      name="branch_name"
                      value={form.branch_name}
                      onChange={handleChange}
                      placeholder="e.g., Shukrawar Peth Branch"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Principal Name"
                      name="principal_name"
                      value={form.principal_name}
                      onChange={handleChange}
                      placeholder="e.g., Mrs. Kavita Patil"
                    />
                    <Input
                      label="Contact Person"
                      name="contact_person"
                      value={form.contact_person}
                      onChange={handleChange}
                      placeholder="e.g., Admin Office"
                    />
                  </div>

                  <Textarea
                    label="Tagline / Motto"
                    name="tagline"
                    value={form.tagline}
                    onChange={handleChange}
                    placeholder="e.g., Nurturing young minds for a brighter tomorrow"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <p className="text-sm font-semibold text-slate-700">Address</p>
                  <Textarea
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Full address..."
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="e.g., Kolhapur"
                    />
                    <Input
                      label="State"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="e.g., Maharashtra"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="e.g., 416002"
                    />
                    <Input
                      label="Country"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="e.g., India"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <p className="text-sm font-semibold text-slate-700">Contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g., 9653104744"
                    />
                    <Input
                      label="Alternate Phone"
                      name="alt_phone"
                      value={form.alt_phone}
                      onChange={handleChange}
                      placeholder="e.g., 0231-2456789"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g., info@school.com"
                    />
                    <Input
                      label="Website"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="e.g., https://school.edu.in"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <p className="text-sm font-semibold text-slate-700">Statutory Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Registration No."
                      name="registration_no"
                      value={form.registration_no}
                      onChange={handleChange}
                      placeholder="e.g., Mah/13402/1-4-1998"
                    />
                    <Input
                      label="UDISE No."
                      name="udise_no"
                      value={form.udise_no}
                      onChange={handleChange}
                      placeholder="e.g., 27340500123"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Affiliation No."
                      name="affiliation_no"
                      value={form.affiliation_no}
                      onChange={handleChange}
                      placeholder="e.g., CBSE/1132456"
                    />
                    <Input
                      label="GSTIN"
                      name="gstin"
                      value={form.gstin}
                      onChange={handleChange}
                      placeholder="e.g., 27ABCDE1234F1Z5"
                    />
                  </div>
                </div>
              </div>
            </CardBody>

            <CardFooter>
              {saved && (
                <span className="text-sm" style={{ color: 'var(--color-success)' }}>
                  ✓ Profile saved successfully
                </span>
              )}
              <Button variant="primary" onClick={handleSave} disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>School Logo</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col items-center gap-4">
              <div className="w-[180px] h-[180px] rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 relative overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Building2 size={32} className="mb-2 opacity-50" />
                    <span className="text-xs">No logo uploaded</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-center w-full">
                <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-colors">
                  <Upload size={16} />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="text-xs text-slate-500 text-center max-w-[200px]">
                Upload a square image for best results (PNG or JPG)
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}