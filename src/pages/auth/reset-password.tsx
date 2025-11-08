import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useForm } from 'react-hook-form';
import api from '../../lib/axios';


interface ResetPasswordPageProps {
  onBackToLogin: () => void;
  emailFromQuery?: string;
}

interface ResetPasswordFormData {
  email: string;
  code: string;
  password: string;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBackToLogin, emailFromQuery }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ general?: string }>({});

  const { register, handleSubmit, setValue, formState: { errors: formErrors } } = useForm<ResetPasswordFormData>({
    defaultValues: {
      email: emailFromQuery || '',
      code: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (emailFromQuery) {
      setValue('email', emailFromQuery);
    }
  }, [emailFromQuery, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setErrors({});
    setSuccessMessage(null);
    try {
      await api.post('/api/password/reset', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      setSuccessMessage('تم تغيير كلمة المرور بنجاح!');
    } catch (error: any) {
      setErrors({ general: error.response?.data?.message || 'فشل في تغيير كلمة المرور. تحقق من الكود وحاول مرة أخرى.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-black text-cyan-700 dark:text-cyan-400">إعادة تعيين كلمة المرور</h1>
        <p className="text-base text-slate-500 dark:text-gray-400 mt-2">أدخل بريدك الإلكتروني، كود التحقق، وكلمة المرور الجديدة</p>
      </header>
      <div className="bg-cyan-50 dark:bg-gray-700 border border-cyan-200/50 dark:border-gray-600 rounded-xl p-6 transition-colors duration-300">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            {...register('email', { required: 'البريد الإلكتروني مطلوب' })}
            disabled={!!emailFromQuery}
            className="bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100"
          />
          {formErrors.email && <p className="text-sm text-red-500 dark:text-red-400">{formErrors.email.message}</p>}
          <Input
            type="text"
            placeholder="كود التحقق (6 أرقام)"
            maxLength={6}
            {...register('code', {
              required: 'كود التحقق مطلوب',
              minLength: { value: 6, message: 'كود التحقق يجب أن يكون 6 أرقام' },
              maxLength: { value: 6, message: 'كود التحقق يجب أن يكون 6 أرقام' },
              pattern: { value: /^\d{6}$/, message: 'كود التحقق يجب أن يكون 6 أرقام' },
            })}
            className="bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100"
          />
          {formErrors.code && <p className="text-sm text-red-500 dark:text-red-400">{formErrors.code.message}</p>}
          <Input
            type="password"
            placeholder="كلمة المرور الجديدة"
            {...register('password', {
              required: 'كلمة المرور مطلوبة',
              minLength: { value: 6, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
            })}
            className="bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100"
          />
          {formErrors.password && <p className="text-sm text-red-500 dark:text-red-400">{formErrors.password.message}</p>}
          <Button type="submit" disabled={isLoading} className="w-full mt-4">
            {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'تغيير كلمة المرور'}
          </Button>
          {errors.general && <p className="text-center text-sm text-red-500 dark:text-red-400 mt-2">{errors.general}</p>}
          {successMessage && <p className="text-center text-sm text-green-600 dark:text-green-400 font-bold mt-2">{successMessage}</p>}
        </form>
        <div className="text-center mt-6">
          <Button type="button" variant="outline" onClick={onBackToLogin} className="w-full">العودة لتسجيل الدخول</Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 