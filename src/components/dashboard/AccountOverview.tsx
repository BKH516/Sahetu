import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Stethoscope, Clock, CheckCircle, XCircle, Phone, Calendar, Award, ChevronRight } from 'lucide-react';
import { Account, Doctor } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useDoctorProfile } from '../../hooks';

interface AccountOverviewProps {
  onNavigate: (tab: string) => void;
}

const AccountOverview: React.FC<AccountOverviewProps> = ({ onNavigate }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { profileData, loading } = useDoctorProfile();

  useEffect(() => {
    if (profileData) {
      if (profileData.hospital) {
        const hospitalData = profileData.hospital;
        
        const accountData = {
          ...profileData,
          full_name: hospitalData.full_name || profileData.full_name || 'غير محدد',
          phone_number: profileData.phone_number || '',
          email: profileData.email || 'غير محدد',
          is_approved: profileData.is_approved || 'pending',
          hospital: hospitalData 
        };
        
        const doctorData = {
          id: hospitalData.id,
          account_id: profileData.id,
          specialization: 'إدارة مستشفى',
          address: hospitalData.address || 'غير محدد',
          age: 0,
          gender: 'male',
          instructions_before_booking: null,
          profile_description: 'مدير مستشفى',
          created_at: hospitalData.created_at,
          updated_at: hospitalData.updated_at
        };
        
        setAccount(accountData);
        setDoctor(doctorData);
      } else if (profileData.doctor) {
        setAccount(profileData);
        setDoctor(profileData.doctor);
      } else {
        setAccount({
          ...profileData,
          full_name: profileData.full_name || 'غير محدد',
          phone_number: profileData.phone_number || '',
          email: profileData.email || 'غير محدد',
          is_approved: profileData.is_approved || 'pending'
        });
        setDoctor({
          id: 0,
          account_id: profileData.id || 0,
          specialization: 'غير محدد',
          address: 'غير محدد',
          age: 0,
          gender: 'male',
          instructions_before_booking: null,
          profile_description: 'لا يوجد وصف',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }, [profileData]);

  const getSpecializationText = (specialization: any): string => {
    if (!specialization) return 'غير محدد';
    if (typeof specialization === 'string') return specialization;
    if (typeof specialization === 'object') {
      if (specialization.name_ar) return specialization.name_ar;
      if (specialization.name_en) return specialization.name_en;
      if (specialization.name) return specialization.name;
      if (Array.isArray(specialization) && specialization.length > 0) {
        const first = specialization[0];
        if (typeof first === 'string') return first;
        if (first.name_ar) return first.name_ar;
        if (first.name_en) return first.name_en;
        if (first.name) return first.name;
      }
    }
    return 'غير محدد';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  const isApproved = account?.is_approved === 'approved';
  const accountName = (() => {
    const name = account?.full_name || 
                 account?.hospital?.full_name || 
                 account?.doctor?.full_name || 
                 'غير محدد';
    return name !== 'غير محدد' ? name : 'غير محدد';
  })();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="text-cyan-600 dark:text-cyan-400" size={28} />
            معلومات الحساب
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            بياناتك الشخصية والمهنية
          </p>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105 shadow-md"
        >
          تعديل الملف
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-600 to-blue-600 rounded-full"></div>
            المعلومات الشخصية
          </h3>

          {/* Name */}
          <div className="group flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">الاسم الكامل</p>
              <p className="font-bold text-gray-800 dark:text-white">
                {accountName}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="group flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">البريد الإلكتروني</p>
              <p className="font-bold text-gray-800 dark:text-white break-all">
                {typeof account?.email === 'string' ? account.email : 'غير محدد'}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="group flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">رقم الهاتف</p>
              <p className="font-bold text-gray-800 dark:text-white">
                {account?.phone_number && account.phone_number !== 'غير محدد' ? account.phone_number : 'غير محدد'}
              </p>
            </div>
          </div>

          {/* Specialization */}
          <div className="group flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">التخصص</p>
              <p className="font-bold text-gray-800 dark:text-white">
                {getSpecializationText(doctor?.specialization)}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="group flex items-start gap-3 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">العنوان</p>
              <p className="font-bold text-gray-800 dark:text-white">
                {doctor?.address && doctor.address !== 'غير محدد' ? doctor.address : 'غير محدد'}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Additional Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
            الحالة والمعلومات الإضافية
          </h3>

          {/* Account Status */}
          <div className={`p-6 rounded-xl border-2 ${
            isApproved 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-800' 
              : 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-300 dark:border-orange-800'
          } hover:shadow-lg transition-all duration-300`}>
            <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <Award className={isApproved ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} size={20} />
              حالة الحساب
            </h3>
            <div className="flex items-center gap-3">
              {isApproved ? (
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 dark:bg-green-600 rounded-full shadow-lg animate-pulse">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500 dark:bg-orange-600 rounded-full shadow-lg animate-pulse">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <span className={`font-bold text-lg ${isApproved ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                  {isApproved ? 'موافق عليه' : 'في انتظار الموافقة'}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {isApproved ? 'حسابك نشط ويمكنك استخدام جميع المميزات' : 'سيتم مراجعة حسابك قريباً'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-all duration-300">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
              معلومات إضافية
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">العمر</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {doctor?.age && doctor.age > 0 ? `${doctor.age} سنة` : 'غير محدد'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">الجنس</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {doctor?.gender === 'male' ? 'ذكر' : doctor?.gender === 'female' ? 'أنثى' : 'غير محدد'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">تاريخ التسجيل</span>
                <span className="font-bold text-gray-800 dark:text-white text-xs">
                  {doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Description */}
          {doctor?.profile_description && doctor.profile_description !== 'لا يوجد وصف' && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-sm">الوصف الشخصي</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {doctor.profile_description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountOverview;
