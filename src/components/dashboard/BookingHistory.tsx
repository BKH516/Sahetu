import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import StatisticsCard from './StatisticsCard';
import { CheckCircle, XCircle, BarChart2, ClipboardList, Ban } from 'lucide-react';
import FilterBar from './FilterBar';
import api from '../../lib/axios';
import { Reservation } from '../../types';
import { LoadingOverlay } from '../ui/LoadingStates';

interface BookingHistoryItem {
  id: number;
  patientName: string;
  service: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

const BookingHistory: React.FC = () => {
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  React.useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/doctor/reservations');
        const apiData = res.data;
        const reservations: Reservation[] = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
        
        const historyItems: BookingHistoryItem[] = reservations.map(r => ({
          id: r.id,
          patientName: r.user?.account?.full_name || '-',
          service: r.doctor_service?.name || '-',
          date: r.date,
          startTime: r.start_time,
          endTime: r.end_time,
          status: r.status,
          phone: r.user?.account?.phone_number || '-',
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        setBookingHistory(historyItems);
      } catch (err: any) {
        setError('تعذر تحميل سجل الحجوزات.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  
  const filteredHistory = bookingHistory.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.patientName.includes(searchTerm) || 
                         item.service.includes(searchTerm) ||
                         item.phone.includes(searchTerm);
    const matchesDate = !dateFilter || item.date === dateFilter;
    return matchesStatus && matchesSearch && matchesDate;
  });

  
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHistory = filteredHistory.slice(startIndex, endIndex);

  
  const getStatusText = (status: BookingHistoryItem['status']) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  
  const getStatusColor = (status: BookingHistoryItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  
  const totalBookings = bookingHistory.length;
  const completedBookings = bookingHistory.filter(item => item.status === 'completed').length;
  const cancelledBookings = bookingHistory.filter(item => item.status === 'cancelled').length;
  const rejectedBookings = bookingHistory.filter(item => item.status === 'rejected').length;
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

  return (
    <div className="space-y-6 relative">
      <LoadingOverlay isVisible={loading} />
      {!loading && (
        <>
          {}
          <FilterBar>
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
              <Input
                id="search"
                placeholder="البحث بالاسم أو الخدمة أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="status_filter" className="block text-sm font-medium text-gray-700 mb-1">حالة الحجز</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setDateFilter('');
                }}
                variant="outline"
                className="w-full"
              >
                إعادة تعيين
              </Button>
            </div>
          </FilterBar>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-6">
            <StatisticsCard
              icon={<BarChart2 className="text-primary" />}
              label="إجمالي الحجوزات"
              value={totalBookings}
              color="bg-primary/10 text-primary"
            />
            <StatisticsCard
              icon={<CheckCircle className="text-success" />}
              label="مكتمل"
              value={completedBookings}
              color="bg-success/10 text-success"
            />
            <StatisticsCard
              icon={<XCircle className="text-danger" />}
              label="ملغي"
              value={cancelledBookings}
              color="bg-danger/10 text-danger"
            />
            <StatisticsCard
              icon={<Ban className="text-red-700" />}
              label="مرفوض"
              value={rejectedBookings}
              color="bg-red-100 text-red-700"
            />
            <StatisticsCard
              icon={<ClipboardList className="text-accent" />}
              label="معدل الإكمال"
              value={completionRate + '%'}
              color="bg-accent/10 text-accent"
            />
          </div>

          {}
          <div className="relative overflow-x-auto rounded-2xl card-shadow bg-white mt-4 max-h-[60vh] overflow-y-auto fade-in">
            <table className="min-w-full divide-y divide-gray-200 text-right">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">اسم المريض</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">الخدمة</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">تاريخ الحجز</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">الوقت</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">رقم الهاتف</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">الحالة</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">تاريخ الإكمال</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {error && <div className="text-center text-red-500 py-2">{error}</div>}
                {currentHistory.map((item, idx) => (
                  <tr key={item.id} className={
                    `transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-accent/10`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{item.patientName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.service}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(item.date).toLocaleDateString('en-US')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTime(item.startTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTime(item.endTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{getStatusText(item.status)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US') : '-'}</td>
                    {}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {}
          {totalPages > 1 && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <span className="flex items-center px-4">
                صفحة {currentPage} من {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          )}

          {}
          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-600">جرب تغيير معايير البحث</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookingHistory; 

function formatTime(timeStr: string) {
  if (!timeStr) return '-';
  
  const [hh, mm] = timeStr.split(':');
  return `${hh}:${mm}`;
} 