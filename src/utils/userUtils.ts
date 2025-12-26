
export const cleanOldUserData = () => {
  try {
    // تنظيف البيانات القديمة فقط بدون تعديل الأسماء
    const encodedUser = localStorage.getItem('encoded-user');
    if (!encodedUser) return;
    
    // لا نقوم بتعديل full_name بناءً على البريد الإلكتروني
    // نترك البيانات كما هي من الـ API
  } catch (error) {

  }
};


export const getUserDisplayName = (user: any): string => {
  // نعرض الاسم الكامل فقط إذا كان متوفراً
  if (user?.full_name && user.full_name !== 'غير محدد') {
    return user.full_name;
  }
  
  // إذا لم يكن هناك اسم كامل، نعرض فارغ
  // لا نستخرج الاسم من البريد الإلكتروني أبداً
  return '';
}; 