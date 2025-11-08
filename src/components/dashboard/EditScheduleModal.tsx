import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import DialogCustom from "../ui/DialogCustom";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ScheduleItem {
  id: number;
  day: string;
  start: string;
  end: string;
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (updatedItem: ScheduleItem) => void;
  initialData: ScheduleItem;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  initialData,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    day: "",
    start: "",
    end: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        day: initialData.day,
        start: initialData.start,
        end: initialData.end,
      });
    }
  }, [initialData]);

  const days = [
    'saturday',
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedItem: ScheduleItem = {
      id: initialData.id,
      ...formData,
    };
    onEdit(updatedItem);
    onClose();
  };

  return (
    <DialogCustom
      open={isOpen}
      onOpenChange={onClose}
      title={t('schedule.editAppointment') || t('common.edit')}
      description={t('schedule.editAppointmentDesc') || 'قم بتحديث تفاصيل الموعد'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {t('schedule.day') || 'اليوم'}
            </label>
            <Select value={formData.day} onValueChange={(value: string) =>
              setFormData((prev) => ({ ...prev, day: value }))
            }>
              <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all">
                <SelectValue placeholder={t('schedule.selectDay') || 'اختر اليوم'} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 bg-white border-2 border-gray-200 rounded-xl">
                {days.map((day) => (
                  <SelectItem key={day} value={day} className="text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20">
                    {t(`schedule.days.${day}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {t('schedule.startTime')}
              </label>
              <Input
                type="time"
                value={formData.start}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start: e.target.value }))
                }
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                {t('schedule.endTime')}
              </label>
              <Input
                type="time"
                value={formData.end}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end: e.target.value }))
                }
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="button" 
            variant="outline"
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-all"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg transition-all"
          >
            {t('schedule.updateAppointment') || t('common.save')}
          </Button>
        </div>
      </form>
    </DialogCustom>
  );
};

export default EditScheduleModal; 