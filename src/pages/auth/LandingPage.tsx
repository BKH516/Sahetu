import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Shield, Clock, Calendar, Users, TrendingUp, CheckCircle, 
  FileText, BarChart3, Settings, Smartphone, Globe, Lock, Star,
  MessageCircle, Mail, Phone, MapPin, Zap, UserCheck, Award, Heart, X,
  Sun, Moon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FloatingElements from '../../components/ui/FloatingElements';
import Particles3D from '../../components/ui/Particles3D';
import { useTheme } from '../../hooks/useTheme';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const { t, i18n } = useTranslation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { isDark, toggleTheme } = useTheme();
  const isRTL = i18n.language === 'ar';
  const mouseUpdateIntervalRef = React.useRef<number | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    // Skip heavy mouse effects if user prefers reduced motion or on mobile
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isMobile) {
      return;
    }

    // Throttle mouse move more aggressively - update only every 100ms instead of every frame
    let lastUpdate = 0;
    const throttleDelay = 100; // Update every 100ms for better performance
    let cachedWidth = window.innerWidth;
    let cachedHeight = window.innerHeight;
    
    // Cache window dimensions and update only on resize
    const updateDimensions = () => {
      cachedWidth = window.innerWidth;
      cachedHeight = window.innerHeight;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Only update if enough time has passed
      if (now - lastUpdate < throttleDelay) {
        return;
      }
      lastUpdate = now;
      
      // Use requestAnimationFrame to batch updates
      if (mouseUpdateIntervalRef.current !== null) {
        cancelAnimationFrame(mouseUpdateIntervalRef.current);
      }
      
      mouseUpdateIntervalRef.current = requestAnimationFrame(() => {
        setMousePosition({
          x: (e.clientX / cachedWidth - 0.5) * 10, // Reduced multiplier for less movement
          y: (e.clientY / cachedHeight - 0.5) * 10,
        });
        mouseUpdateIntervalRef.current = null;
      });
    };

    // Throttled resize handler
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        updateDimensions();
      }, 300); // Increased debounce time
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (mouseUpdateIntervalRef.current !== null) {
        cancelAnimationFrame(mouseUpdateIntervalRef.current);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []);

  const features = [
    {
      icon: Shield,
      title: t('auth.landing.features.advancedSecurity'),
      description: t('auth.landing.features.advancedSecurityDesc'),
      color: 'text-blue-500',
    },
    {
      icon: Clock,
      title: t('auth.landing.features.timeManagement'),
      description: t('auth.landing.features.timeManagementDesc'),
      color: 'text-cyan-500',
    },
    {
      icon: Calendar,
      title: t('auth.landing.features.smoothBookings'),
      description: t('auth.landing.features.smoothBookingsDesc'),
      color: 'text-emerald-500',
    },
    {
      icon: Users,
      title: t('auth.landing.features.patientManagement'),
      description: t('auth.landing.features.patientManagementDesc'),
      color: 'text-purple-500',
    },
  ];

  const stats = [
    { number: '500+', label: t('auth.landing.stats.doctorsRegistered'), icon: UserCheck },
    { number: '10K+', label: t('auth.landing.stats.monthlyBookings'), icon: Calendar },
    { number: '24/7', label: t('auth.landing.stats.support'), icon: MessageCircle },
  ];

  const detailedFeatures = [
    {
      category: t('auth.landing.detailedFeatures.security.category'),
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      description: t('auth.landing.detailedFeatures.security.description'),
      items: [
        { title: t('auth.landing.detailedFeatures.security.items.encryption'), description: t('auth.landing.detailedFeatures.security.items.encryptionDesc') },
        { title: t('auth.landing.detailedFeatures.security.items.twoFactor'), description: t('auth.landing.detailedFeatures.security.items.twoFactorDesc') },
        { title: t('auth.landing.detailedFeatures.security.items.backup'), description: t('auth.landing.detailedFeatures.security.items.backupDesc') },
        { title: t('auth.landing.detailedFeatures.security.items.hipaa'), description: t('auth.landing.detailedFeatures.security.items.hipaaDesc') },
      ],
    },
    {
      category: t('auth.landing.detailedFeatures.clinicManagement.category'),
      icon: Settings,
      color: 'from-emerald-500 to-teal-600',
      description: t('auth.landing.detailedFeatures.clinicManagement.description'),
      items: [
        { title: t('auth.landing.detailedFeatures.clinicManagement.items.scheduling'), description: t('auth.landing.detailedFeatures.clinicManagement.items.schedulingDesc') },
        { title: t('auth.landing.detailedFeatures.clinicManagement.items.patientManagement'), description: t('auth.landing.detailedFeatures.clinicManagement.items.patientManagementDesc') },
        { title: t('auth.landing.detailedFeatures.clinicManagement.items.serviceManagement'), description: t('auth.landing.detailedFeatures.clinicManagement.items.serviceManagementDesc') },
        { title: t('auth.landing.detailedFeatures.clinicManagement.items.reports'), description: t('auth.landing.detailedFeatures.clinicManagement.items.reportsDesc') },
      ],
    },
    {
      category: t('auth.landing.detailedFeatures.patientExperience.category'),
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
      description: t('auth.landing.detailedFeatures.patientExperience.description'),
      items: [
        { title: t('auth.landing.detailedFeatures.patientExperience.items.quickBooking'), description: t('auth.landing.detailedFeatures.patientExperience.items.quickBookingDesc') },
        { title: t('auth.landing.detailedFeatures.patientExperience.items.reminders'), description: t('auth.landing.detailedFeatures.patientExperience.items.remindersDesc') },
        { title: t('auth.landing.detailedFeatures.patientExperience.items.digitalRecord'), description: t('auth.landing.detailedFeatures.patientExperience.items.digitalRecordDesc') },
        { title: t('auth.landing.detailedFeatures.patientExperience.items.ratings'), description: t('auth.landing.detailedFeatures.patientExperience.items.ratingsDesc') },
      ],
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: t('auth.landing.howItWorks.step1'),
      description: t('auth.landing.howItWorks.step1Desc'),
      icon: UserCheck,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: '2',
      title: t('auth.landing.howItWorks.step2'),
      description: t('auth.landing.howItWorks.step2Desc'),
      icon: FileText,
      color: 'from-cyan-500 to-emerald-500',
    },
    {
      step: '3',
      title: t('auth.landing.howItWorks.step3'),
      description: t('auth.landing.howItWorks.step3Desc'),
      icon: Zap,
      color: 'from-emerald-500 to-purple-500',
    },
  ];

  const testimonials = [
    {
      name: t('auth.landing.testimonials.doctor1.name'),
      specialty: t('auth.landing.testimonials.doctor1.specialty'),
      rating: 5,
      text: t('auth.landing.testimonials.doctor1.text'),
      avatar: '👨‍⚕️',
    },
    {
      name: t('auth.landing.testimonials.doctor2.name'),
      specialty: t('auth.landing.testimonials.doctor2.specialty'),
      rating: 5,
      text: t('auth.landing.testimonials.doctor2.text'),
      avatar: '👩‍⚕️',
    },
    {
      name: t('auth.landing.testimonials.doctor3.name'),
      specialty: t('auth.landing.testimonials.doctor3.specialty'),
      rating: 5,
      text: t('auth.landing.testimonials.doctor3.text'),
      avatar: '👨‍⚕️',
    },
  ];

  const faqs = useMemo(() => [
    {
      question: t('auth.landing.faq1.question'),
      answer: t('auth.landing.faq1.answer'),
    },
    {
      question: t('auth.landing.faq2.question'),
      answer: t('auth.landing.faq2.answer'),
    },
    {
      question: t('auth.landing.faq3.question'),
      answer: t('auth.landing.faq3.answer'),
    },
    {
      question: t('auth.landing.faq4.question'),
      answer: t('auth.landing.faq4.answer'),
    },
    {
      question: t('auth.landing.faq5.question'),
      answer: t('auth.landing.faq5.answer'),
    },
    {
      question: t('auth.landing.faq6.question'),
      answer: t('auth.landing.faq6.answer'),
    },
  ], [t]);

  return (
    <div className="landing-page min-h-screen overflow-hidden relative bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 3D Background Elements */}
      <FloatingElements />
      <Particles3D count={20} />

      {/* Mouse Follow Light - Optimized with reduced updates */}
      {!isMobile && (
      <motion.div
          className="fixed w-96 h-96 rounded-full opacity-20 blur-[128px] pointer-events-none z-10"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 70%)',
            willChange: 'transform',
        }}
        animate={{
            x: mousePosition.x * 30, // Reduced multiplier
            y: mousePosition.y * 30,
        }}
        transition={{
          type: 'spring',
            stiffness: 100,
            damping: 30,
            mass: 0.5,
        }}
      />
      )}

      <div className="relative z-20 min-h-screen">
        {/* Header */}
        <motion.header
          className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 pt-6 lg:pt-5 pb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl border-2 border-blue-600/20 dark:border-blue-400/20 p-2">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/sihatelogo.png`}
                    alt={t('auth.landing.platformNameShort')}
                    className="w-full h-full object-contain drop-shadow-lg"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {/* Theme Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center"
                aria-label={isDark ? t('dashboard.lightMode') : t('dashboard.darkMode')}
                title={isDark ? t('dashboard.lightMode') : t('dashboard.darkMode')}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
              >
                {t('auth.landing.getStarted')}
                <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="inline-block"
                >
                
                </motion.div>

                <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {t('auth.landing.title')}
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                    {t('auth.landing.subtitle')}
                  </span>
                </h2>

                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('auth.landing.description')}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"
                  >
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-wrap gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group"
                >
                  {t('auth.landing.getStarted')}
                  <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>

                <button 
                  onClick={onLogin}
                  className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-900 dark:text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 transform hover:scale-105"
                >
                  {t('auth.landing.login')}
                </button>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative z-10">
                {/* 3D Card Effect - Optimized */}
                <motion.div
                  className="relative p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20"
                  animate={{
                    rotateY: mousePosition.x,
                    rotateX: mousePosition.y,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100, // Increased for snappier response
                    damping: 30, // Increased damping to reduce oscillation
                    mass: 0.5, // Reduced mass for faster response
                  }}
                  style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="w-48 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"></div>
                        <div className="w-32 h-3 bg-gray-300 dark:bg-gray-600 rounded-lg mt-2"></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="w-48 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg"></div>
                        <div className="w-32 h-3 bg-gray-300 dark:bg-gray-600 rounded-lg mt-2"></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="w-48 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"></div>
                        <div className="w-32 h-3 bg-gray-300 dark:bg-gray-600 rounded-lg mt-2"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Badges */}
                <motion.div
                  className="absolute -top-4 -left-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-3 rounded-2xl shadow-xl"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <CheckCircle className="w-6 h-6" />
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -right-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-3 rounded-2xl shadow-xl"
                  animate={{
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                >
                  <Shield className="w-6 h-6" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t('auth.landing.platformFeatures')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('auth.landing.platformFeaturesDesc')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, rotateY: 10 }}
                className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className={`w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Detailed Features - Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {detailedFeatures.map((category, catIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setSelectedCategory(category.category)}
                className="cursor-pointer p-8 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">
                  {category.category}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6 text-sm">
                  {category.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group">
                  <span>{t('auth.landing.viewDetails')}</span>
                  <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Modal for Category Details */}
          <AnimatePresence>
            {selectedCategory && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                  onClick={() => setSelectedCategory(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-20 w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg`}
                      aria-label={t('common.close')}
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
                    </button>

                    {/* Header - Fixed */}
                    {(() => {
                      const category = detailedFeatures.find(c => c.category === selectedCategory);
                      if (!category) return null;
                      return (
                        <div className={`bg-gradient-to-br ${category.color} p-8 text-white relative overflow-hidden flex-shrink-0`}>
                          <div className="absolute inset-0 bg-gradient-to-br opacity-20"></div>
                          <div className="relative z-10 text-center">
                            <div className={`w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                              <category.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-bold mb-2">{category.category}</h3>
                            <p className="text-white/90 text-lg">{category.description}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto premium-scrollbar min-h-0">
                      <div className="p-8">
                        <div className="grid md:grid-cols-2 gap-6">
                          {detailedFeatures
                            .find(c => c.category === selectedCategory)
                            ?.items.map((item, index) => (
                              <motion.div
                                key={item.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`w-10 h-10 bg-gradient-to-br ${detailedFeatures.find(c => c.category === selectedCategory)?.color || 'from-blue-500 to-blue-600'} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                                      {item.title}
                                    </h5>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer with Cancel Button - Fixed */}
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-xl p-4 flex items-center justify-end gap-3 flex-shrink-0">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-300 hover:scale-105 shadow-md"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl my-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t('auth.landing.howItWorksTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('auth.landing.howItWorksSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 text-center relative">
                  <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {step.step}
                  </div>
                  <div className={`mt-4 mb-6 mx-auto w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Statistics Section */}
        <section className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t('auth.landing.platformStats')}
            </h3>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-blue-200/20 dark:border-blue-800/20 text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t('auth.landing.testimonialsTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('auth.landing.testimonialsSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"
              >
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.specialty}
                    </p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic">
                  "{testimonial.text}"
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {t('auth.landing.faqTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('auth.landing.faqSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"
              >
                <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white flex items-start">
                  <MessageCircle className="w-5 h-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                  {faq.question}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-cyan-600/90"></div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-white mb-4">
                {t('auth.landing.readyToStart')}
              </h3>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                {t('auth.landing.joinDoctors')}
              </p>
              <button
                onClick={onGetStarted}
                className="px-10 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                {t('auth.landing.getStartedNow')}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto max-w-[95%] sm:max-w-[96%] md:max-w-[97%] lg:max-w-[98%] px-2 sm:px-3 md:px-4 py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/sihatelogo.png`}
                    alt={t('auth.landing.platformNameShort')}
                    className="w-8 h-8 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {t('auth.landing.platformNameShort')}
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('auth.landing.platformDescriptionShort')}
              </p>
            </div>

            <div>
              <h5 className="font-bold mb-4 text-gray-900 dark:text-white">{t('auth.landing.footerPlatform')}</h5>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerFeatures')}</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerPricing')}</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerHowItWorks')}</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerAbout')}</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold mb-4 text-gray-900 dark:text-white">{t('auth.landing.footerSupport')}</h5>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerHelpCenter')}</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerDocumentation')}</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerContact')}</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">{t('auth.landing.footerFAQ')}</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold mb-4 text-gray-900 dark:text-white">{t('auth.landing.footerContactUs')}</h5>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:info@sahti.com" className="hover:text-blue-600 transition-colors">info@sahti.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+966123456789" className="hover:text-blue-600 transition-colors">+966 12 345 6789</a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{t('auth.landing.footerAddress')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} {t('auth.landing.footerCopyright')}
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors text-sm">
                {t('auth.landing.footerPrivacyPolicy')}
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors text-sm">
                {t('auth.landing.footerTermsOfUse')}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;

