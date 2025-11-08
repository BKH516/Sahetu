

export interface Role {
  id: number;
  name: 'admin' | 'doctor' | 'nurse' | 'user';
  guard_name: string;
  created_at: string;
  updated_at: string;
  pivot: {
    model_type: string;
    model_id: number;
    role_id: number;
  };
}

export interface Account {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  is_approved: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  roles: Role[];
  doctor?: Doctor;
  hospital?: Hospital;
}

export interface Hospital {
  id: number;
  account_id: number;
  full_name: string;
  address: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: number;
  account_id: number;
  specialization: string;
  address: string;
  age: number;
  gender: 'male' | 'female';
  instructions_before_booking: string | null;
  profile_description?: string;
  license_image_path?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: number;
  account_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  specialization: string;
  specialization_id?: number;
  address: string;
  age: number;
  gender: 'male' | 'female';
  profile_description: string;
  license_image_path?: string;
  instructions_before_booking?: string;
  years_of_experience?: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  phone_number?: string;
  address?: string;
  age?: number;
  gender?: 'male' | 'female';
  profile_description?: string;
  instructions_before_booking?: string;
}

export interface DoctorWorkSchedule {
  id: number;
  doctor_id: number;
  day_of_week: 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorService {
  id: number;
  doctor_id: number;
  name: string;
  price: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface User {
    id: number;
    account_id: number;
    age: number;
    gender: 'male' | 'female';
    account: Account;
}

export interface Reservation {
    id: number;
    user_id: number;
    doctor_service_id: number;
    doctor_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    user: User;
    doctor_service: DoctorService;
    created_at: string;
    updated_at: string;
    notes?: string;
}

export interface Specialization {
  id: number;
  name_ar: string;
  name_en: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface AppNotification {
    id: number;
    type: 'reservation' | 'service' | 'schedule' | 'system' | 'approval';
    title: string;
    message: string;
    data?: any;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface NotificationStats {
    total: number;
    unread: number;
}
