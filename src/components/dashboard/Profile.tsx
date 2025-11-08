import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, Calendar, UserCheck, FileText, Save, Edit3, X, Upload, Award, Briefcase, Mail, Sun, Moon, Globe, Settings } from 'lucide-react';
import { ApiEndpointHelper } from '../../lib/apiEndpoints';
import { DoctorProfile, ProfileUpdateData } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuthStore } from '../../store/auth.store';
import { useDoctorProfile } from '../../hooks';
import { useTheme } from '../../hooks/useTheme';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { isDark, toggleTheme } = useTheme();
  const updateUser = useAuthStore((state) => state.updateUser);
  const { refetch: refetchDoctorProfile } = useDoctorProfile();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<File | null>(null);

  const [formData, setFormData] = useState<ProfileUpdateData>({
    full_name: '',
    phone_number: '',
    address: '',
    age: 0,
    gender: 'male',
    profile_description: '',
    instructions_before_booking: ''
  });
  const [specializationId, setSpecializationId] = useState<number | null>(null);
  const [specializations, setSpecializations] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    loadSpecializations();
  }, []);

  const getSpecializationText = (specialization: any): string => {
    if (!specialization) return t('profile.notSpecified');
    if (typeof specialization === 'string') return specialization;
    if (typeof specialization === 'object') {
      if (isRTL && specialization.name_ar) return specialization.name_ar;
      if (!isRTL && specialization.name_en) return specialization.name_en;
      if (specialization.name_ar) return specialization.name_ar;
      if (specialization.name_en) return specialization.name_en;
      if (specialization.name) return specialization.name;
      if (Array.isArray(specialization) && specialization.length > 0) {
        const first = specialization[0];
        if (typeof first === 'string') return first;
        if (isRTL && first.name_ar) return first.name_ar;
        if (!isRTL && first.name_en) return first.name_en;
        if (first.name_ar) return first.name_ar;
        if (first.name_en) return first.name_en;
        if (first.name) return first.name;
      }
    }
    return t('profile.notSpecified');
  };

  const safeDisplayText = (value: any, fallback: string = t('profile.notSpecified')): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value.trim() || fallback;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? t('profile.yes') : t('profile.no');
    if (typeof value === 'object') {
      if (isRTL && value.name_ar) return value.name_ar;
      if (!isRTL && value.name_en) return value.name_en;
      if (value.name_ar) return value.name_ar;
      if (value.name_en) return value.name_en;
      if (value.name) return value.name;
      if (value.title) return value.title;
      if (value.label) return value.label;
      if (value.text) return value.text;
      if (value.description) return value.description;
    }
    return fallback;
  };

  const safeDisplayAge = (value: any): string => {
    if (value === null || value === undefined) return t('profile.notSpecified');
    if (typeof value === 'number') return `${value} ${t('profile.years')}`;
    if (typeof value === 'string') {
      const num = parseInt(value);
      if (!isNaN(num)) return `${num} ${t('profile.years')}`;
    }
    return t('profile.notSpecified');
  };

  const loadSpecializations = async () => {
    try {
      const response = await ApiEndpointHelper.getSpecializations();
      const specializationsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setSpecializations(specializationsData);
    } catch (error) {
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiEndpointHelper.getDoctorProfile();
      
      let profileData: DoctorProfile;
      
      if (Array.isArray(response.data)) {
        const validItems = response.data.filter((item: any) => item !== null && item !== undefined);
        const itemWithHospital = validItems.find((item: any) => item?.hospital);
        const itemWithDoctor = validItems.find((item: any) => item?.doctor);
        const selectedItem = itemWithHospital || itemWithDoctor || validItems[0];
        
        if (!selectedItem) {
          throw new Error(t('profile.noDataAvailable'));
        }
        
        if (selectedItem.hospital) {
          profileData = {
            id: selectedItem.hospital.id,
            account_id: selectedItem.id,
            full_name: safeDisplayText(
              selectedItem.hospital.full_name || 
              selectedItem.full_name || 
              selectedItem.name, 
              t('profile.notSpecified')
            ),
            email: safeDisplayText(selectedItem.email, t('profile.notSpecified')),
            phone_number: selectedItem.phone_number || selectedItem.hospital?.phone_number || '',
            specialization: t('profile.hospitalManagement'),
            address: safeDisplayText(selectedItem.hospital.address, t('profile.notSpecified')),
            age: 0,
            gender: 'male',
            profile_description: t('profile.hospitalManager'),
            license_image_path: '',
            instructions_before_booking: '',
            created_at: selectedItem.hospital.created_at || '',
            updated_at: selectedItem.hospital.updated_at || ''
          };
        } else {
          profileData = {
            id: selectedItem?.doctor?.id || 0,
            account_id: selectedItem?.id || 0,
            full_name: safeDisplayText(
              selectedItem?.full_name || 
              selectedItem?.doctor?.full_name || 
              selectedItem?.name || 
              selectedItem?.account?.full_name, 
              t('profile.notSpecified')
            ),
            email: safeDisplayText(selectedItem?.email, t('profile.notSpecified')),
            phone_number: selectedItem?.phone_number || selectedItem?.account?.phone_number || selectedItem?.doctor?.phone_number || '',
            specialization: getSpecializationText(selectedItem?.doctor?.specialization),
            specialization_id: selectedItem?.doctor?.specialization_id || null,
            address: safeDisplayText(selectedItem?.doctor?.address, t('profile.notSpecified')),
            age: selectedItem?.doctor?.age || 0,
            gender: selectedItem?.doctor?.gender || 'male',
            profile_description: safeDisplayText(selectedItem?.doctor?.profile_description, t('profile.noDescription')),
            license_image_path: selectedItem?.doctor?.license_image_path || '',
            instructions_before_booking: safeDisplayText(selectedItem?.doctor?.instructions_before_booking, ''),
            created_at: selectedItem?.doctor?.created_at || '',
            updated_at: selectedItem?.doctor?.updated_at || ''
          };
        }
      } else {
        profileData = {
          id: response.data?.doctor?.id || 0,
          account_id: response.data?.id || 0,
          full_name: safeDisplayText(
            response.data?.full_name || 
            response.data?.doctor?.full_name || 
            response.data?.name || 
            response.data?.account?.full_name, 
            t('profile.notSpecified')
          ),
          email: safeDisplayText(response.data?.email, t('profile.notSpecified')),
          phone_number: response.data?.phone_number || response.data?.account?.phone_number || response.data?.doctor?.phone_number || '',
          specialization: getSpecializationText(response.data?.doctor?.specialization),
          specialization_id: response.data?.doctor?.specialization_id || null,
          address: safeDisplayText(response.data?.doctor?.address, t('profile.notSpecified')),
          age: response.data?.doctor?.age || 0,
          gender: response.data?.doctor?.gender || 'male',
          profile_description: safeDisplayText(response.data?.doctor?.profile_description, t('profile.noDescription')),
          license_image_path: response.data?.doctor?.license_image_path || '',
          instructions_before_booking: safeDisplayText(response.data?.doctor?.instructions_before_booking, ''),
          created_at: response.data?.doctor?.created_at || '',
          updated_at: response.data?.doctor?.updated_at || ''
        };
      }

      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name === t('profile.notSpecified') ? '' : profileData.full_name,
        phone_number: profileData.phone_number || '',
        address: profileData.address === t('profile.notSpecified') ? '' : profileData.address,
        age: profileData.age,
        gender: profileData.gender,
        profile_description: profileData.profile_description === t('profile.noDescription') ? '' : profileData.profile_description,
        instructions_before_booking: profileData.instructions_before_booking || ''
      });
      
      if (profileData.specialization_id) {
        setSpecializationId(profileData.specialization_id);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || t('profile.loadError');
      setError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const submitData = new FormData();
      
      if (formData.full_name) {
        submitData.append('full_name', formData.full_name);
      }
      
      if (formData.phone_number) {
        submitData.append('phone_number', formData.phone_number);
      }
      
      if (specializationId) {
        submitData.append('specialization_id', specializationId.toString());
      }
      
      if (formData.address) {
        submitData.append('address', formData.address);
      }
      
      if (formData.age && formData.age > 0) {
        submitData.append('age', formData.age.toString());
      }
      
      if (formData.gender) {
        submitData.append('gender', formData.gender);
      }
      
      if (formData.profile_description) {
        submitData.append('profile_description', formData.profile_description);
      }
      
      if (formData.instructions_before_booking) {
        submitData.append('instructions_before_booking', formData.instructions_before_booking);
      }
      
      if (licenseImage) {
        submitData.append('license_image', licenseImage);
      }

      const response = await ApiEndpointHelper.updateDoctorProfile(submitData);
      
      if (response.status === 200 || response.status === 201) {
        if (formData.phone_number || formData.full_name) {
          const updateData: any = {};
          if (formData.phone_number) {
            updateData.phone_number = formData.phone_number;
          }
          if (formData.full_name) {
            updateData.full_name = formData.full_name;
          }
          updateUser(updateData);
        }
        
        setSuccess(t('profile.profileUpdated'));
        setIsEditing(false);
        
        // تحديث cache الـ useDoctorProfile حتى تتحدث الصفحة الرئيسية
        await refetchDoctorProfile();
        
        setTimeout(async () => {
          await loadProfile();
          setSuccess(null);
        }, 2000);
      } else {
        throw new Error(t('profile.updateFailed'));
      }

    } catch (error: any) {
      // دالة لتنظيف الرسائل من "and X more error(s)"
      const cleanErrorMessage = (msg: string): string => {
        return String(msg)
          .replace(/\(and \d+ more errors?\)/gi, '')
          .replace(/\(and \d+ more\)/gi, '')
          .replace(/and \d+ more errors?\.?/gi, '')
          .trim();
      };
      
      let errorMessage = t('profile.updateFailed');
      
      if (error.response?.data?.message) {
        errorMessage = cleanErrorMessage(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errorMessage = cleanErrorMessage(errors.join(', '));
      } else if (error.message) {
        errorMessage = cleanErrorMessage(error.message);
      }
      
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalidImageFile'));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError(t('profile.imageTooLarge', '❌ Image size must be less than 5 MB'));
        return;
      }
      
      setLicenseImage(file);
      setError(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-3xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 flex items-center gap-4 lg:gap-6">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 hover:scale-110 transition-transform duration-300">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">{t('dashboard.profile')}</h1>
            <p className="text-cyan-100 text-sm lg:text-lg">{t('profile.manageInfo', 'Manage your personal and professional information')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error && !profile ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center animate-shake">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">{t('common.error')}</div>
          <div className="text-red-500 dark:text-red-300">{error}</div>
          <button
            onClick={loadProfile}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-600" />
                {t('profile.personalInfo', 'Personal Information')}
              </h2>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setError(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                {isEditing ? <X size={18} /> : <Edit3 size={18} />}
                {isEditing ? t('common.cancel') : t('common.edit')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Full Name */}
              <div className="space-y-2 group">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <User size={16} />
                  {t('profile.fullName')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                    placeholder={t('profile.fullName')}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl text-slate-900 dark:text-slate-100 group-hover:shadow-md transition-all duration-300">
                    {safeDisplayText(profile.full_name, t('profile.notSpecified'))}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2 group">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Mail size={16} />
                  {t('profile.email', 'Email')}
                </label>
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl text-slate-900 dark:text-slate-100 group-hover:shadow-md transition-all duration-300">
                  {safeDisplayText(profile.email, t('profile.notSpecified'))}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2 group">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Phone size={16} />
                  {t('profile.phoneNumber')}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                    placeholder={t('profile.phoneNumber')}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl text-slate-900 dark:text-slate-100 group-hover:shadow-md transition-all duration-300">
                    {safeDisplayText(profile.phone_number, t('profile.notSpecified'))}
                  </div>
                )}
              </div>

              {/* Age */}
              <div className="space-y-2 group">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Calendar size={16} />
                  {t('profile.age')}
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                    placeholder={t('profile.age')}
                    min="18"
                    max="100"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl text-slate-900 dark:text-slate-100 group-hover:shadow-md transition-all duration-300">
                    {safeDisplayAge(profile.age)}
                  </div>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2 group">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <UserCheck size={16} />
                  {t('profile.gender')}
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as 'male' | 'female'})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  >
                    <option value="male">{t('auth.register.male')}</option>
                    <option value="female">{t('auth.register.female')}</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl text-slate-900 dark:text-slate-100 group-hover:shadow-md transition-all duration-300">
                    {profile.gender === 'male' ? t('auth.register.male') : profile.gender === 'female' ? t('auth.register.female') : t('profile.notSpecified')}
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2 group">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <MapPin size={16} />
                  {t('profile.address')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                    placeholder={t('profile.address')}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl text-slate-900 dark:text-slate-100 group-hover:shadow-md transition-all duration-300">
                    {safeDisplayText(profile.address, t('profile.notSpecified'))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
              <Briefcase className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
              {t('profile.professionalInfo', 'Professional Information')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* Specialization */}
              <div className="space-y-2 group md:col-span-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Award size={16} />
                  {t('profile.specialization')}
                </label>
                {isEditing ? (
                  <select
                    value={specializationId || ''}
                    onChange={(e) => setSpecializationId(parseInt(e.target.value) || null)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  >
                    <option value="">{t('profile.selectSpecialization')}</option>
                    {specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name_ar || spec.name || spec.name_en}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl text-slate-900 dark:text-slate-100 border border-green-200 dark:border-green-800 group-hover:shadow-md transition-all duration-300">
                    {getSpecializationText(profile.specialization)}
                  </div>
                )}
              </div>

              {/* License Image Upload */}
              {isEditing && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Upload size={16} />
                    {t('profile.uploadLicense', 'Upload License Image')}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="license-image-upload"
                    />
                    <label
                      htmlFor="license-image-upload"
                      className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-cyan-300 dark:border-cyan-600 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 cursor-pointer transition-all duration-300 group"
                    >
                      <Upload size={20} className="text-cyan-600 group-hover:scale-110 transition-transform" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {licenseImage ? licenseImage.name : t('profile.selectLicenseImage', 'Choose license image')}
                      </span>
                    </label>
                    {licenseImage && (
                      <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {t('profile.licenseImageSelected', { name: licenseImage.name, defaultValue: 'Image selected: {{name}}' })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Description Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
              {t('profile.profileDescription', 'Profile Description')}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('profile.profileDescription')}</label>
                {isEditing ? (
                  <textarea
                    value={formData.profile_description}
                    onChange={(e) => setFormData({...formData, profile_description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-all duration-300"
                    placeholder={t('profile.profileDescription')}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl text-slate-900 dark:text-slate-100 min-h-[100px] border border-blue-200 dark:border-blue-800">
                    {safeDisplayText(profile.profile_description, t('profile.noDescription'))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('profile.instructionsBeforeBooking')}</label>
                {isEditing ? (
                  <textarea
                    value={formData.instructions_before_booking}
                    onChange={(e) => setFormData({...formData, instructions_before_booking: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-all duration-300"
                    placeholder={t('profile.instructionsPlaceholder', 'Instructions for patients before booking (optional)')}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl text-slate-900 dark:text-slate-100 min-h-[80px] border border-amber-200 dark:border-amber-800">
                    {safeDisplayText(profile.instructions_before_booking, t('profile.noDescription'))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-center animate-slide-up">
              <button
                onClick={handleSubmit}
                disabled={updating}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {updating ? <LoadingSpinner size="sm" color="white" /> : <Save size={20} />}
                {updating ? t('common.saving', 'Saving...') : t('profile.saveChanges')}
              </button>
            </div>
          )}

          {/* Settings Card - Language & Theme */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-cyan-600" />
              <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {t('profile.settings')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language Setting */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Globe className="w-5 h-5 text-cyan-600" />
                  {t('language.label', 'Language')}
                </label>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <LanguageSwitcher />
                </div>
              </div>

              {/* Theme Setting */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {isDark ? (
                    <Moon className="w-5 h-5 text-cyan-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-cyan-600" />
                  )}
                  {t('profile.theme', 'Theme')}
                </label>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-blue-900 dark:to-indigo-900 hover:from-yellow-200 hover:to-orange-200 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-yellow-600 dark:text-blue-300 rounded-lg transition-all duration-300 hover:scale-105 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      {isDark ? (
                        <Sun size={20} className="transition-transform duration-300" />
                      ) : (
                        <Moon size={20} className="transition-transform duration-300" />
                      )}
                      <span className="font-medium">
                        {isDark ? t('dashboard.lightMode', 'Light Mode') : t('dashboard.darkMode', 'Dark Mode')}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Success Message */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-down border-2 border-green-400">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {success}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && profile && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-shake border-2 border-red-400 max-w-md">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white hover:text-red-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
