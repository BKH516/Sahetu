import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import DialogCustom from "../ui/DialogCustom";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { sanitizeInput } from "../../utils/utils";

interface ScheduleItem {
  id: number;
  day: string;
  start: string;
  end: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newItem: ScheduleItem) => void;
  existingSchedule: ScheduleItem[];
}

const days = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

function DayDropdown({ value, onChange }: { value: string; onChange: (day: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-4 py-3 border-2 border-cyan-400 dark:border-cyan-600 rounded-xl bg-white dark:bg-gray-800 text-right text-gray-800 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-700 transition"
        onClick={() => setOpen((prev) => !prev)}
      >
        {value ? t(`schedule.days.${value}`) : t('schedule.selectDay') || 'اختر اليوم'}
        <span className="float-left">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border-2 border-cyan-400 dark:border-cyan-600 rounded-xl shadow-lg mt-2 max-h-[25vh] overflow-y-auto">
          {days.map((day: string) => (
            <div
              key={day}
              className={`px-4 py-3 cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-gray-900 dark:text-gray-100 ${value === day ? "bg-cyan-100 dark:bg-cyan-900/50 font-bold" : ""}`}
              onClick={() => {
                onChange(day);
                setOpen(false);
              }}
            >
              {t(`schedule.days.${day}`)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    day: "",
    start: "",
    end: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedData = {
      day: sanitizeInput(formData.day),
      start: sanitizeInput(formData.start),
      end: sanitizeInput(formData.end)
    };
    
    const newItem: ScheduleItem = {
      id: Date.now(),
      ...sanitizedData,
    };
    onAdd(newItem);
    setFormData({ day: "", start: "", end: "" });
  };

  return (
    <DialogCustom
      open={isOpen}
      onOpenChange={onClose}
      title={t('schedule.addNewAppointment') || t('schedule.addAppointment')}
      description={t('schedule.addAppointmentDesc') || 'أدخل تفاصيل الموعد الجديد'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {t('schedule.day') || 'اليوم'}
            </label>
            <DayDropdown
              value={formData.day}
              onChange={(day) => setFormData((prev) => ({ ...prev, day }))}
            />
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
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg transition-all"
          >
            {t('schedule.addAppointment')}
          </Button>
        </div>
      </form>
    </DialogCustom>
  );
};

export default ScheduleModal; 