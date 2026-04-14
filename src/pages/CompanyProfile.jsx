import { useState, useEffect } from 'react';
import { Save, Upload, Building2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

/**
 * Company Profile Page
 * 
 * Form to edit the school's firm name, address, phone, email, and logo.
 * Singleton row — always updates id=1.
 */

export default function CompanyProfile() {
  const { execute, loading } = useDatabase();

  const [form, setForm] = useState({
    firm_name: '',
    address: '',
    phone: '',
    email: '',
    registration_no: '',
    logo_path: '',
  });
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
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        registration_no: profile.registration_no || '',
        logo_path: profile.logo_path || '',
      });

      // Load logo preview if path exists
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

      // Save the logo to AppData
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
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Company Profile</h1>
        <p className="page-subtitle">Manage your school's identity and branding details</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Form */}
        <div style={{ gridColumn: 'span 2' }}>
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-4">
                <Input
                  label="Firm Name"
                  name="firm_name"
                  value={form.firm_name}
                  onChange={handleChange}
                  placeholder="e.g., Rainbow Play School"
                  required
                />
                <Textarea
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Full address..."
                  rows={3}
                />
                <div className="form-row form-row-2">
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g., 9653104744"
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g., info@rainbowschool.com"
                  />
                </div>
                <Input
                  label="Registration No."
                  name="registration_no"
                  value={form.registration_no}
                  onChange={handleChange}
                  placeholder="e.g., Mah/13402/1-4-1998"
                />
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

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>School Logo</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="photo-upload">
              <div className="photo-preview" style={{ width: '180px', height: '180px' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" />
                ) : (
                  <div className="photo-preview-placeholder">
                    <Building2 size={32} />
                    <span className="text-xs">No logo uploaded</span>
                  </div>
                )}
              </div>
              <div className="photo-actions">
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={14} />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <p className="text-xs text-muted text-center">
                Upload a square image for best results (PNG or JPG)
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
