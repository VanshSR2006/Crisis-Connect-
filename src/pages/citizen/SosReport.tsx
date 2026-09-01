import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCitizenContext } from '@/lib/citizenContext';
import { IncidentCategory } from '@/types';
import { createIncident, buildIncidentPayload } from '@/lib/api/incidents';
import { enqueueSosReport, getOfflineQueue } from '@/lib/offlineQueue';
import { compressImage } from '@/lib/imageCompressor';
import { getStoredUser } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatusStepper } from '@/components/shared/StatusStepper';

import {
  LifeBuoy,
  Stethoscope,
  Utensils,
  Home as ShelterIcon,
  Camera,
  MapPin,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Navigation,
  WifiOff,
  Clock,
} from 'lucide-react';

import { useOfflineSync } from '@/lib/useOfflineSync';

type GeoStatus = 'idle' | 'detecting' | 'acquired' | 'denied' | 'unavailable' | 'timeout';

export const SosReport: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, getNearestShelter, refreshIncidents, lat: contextLat, lng: contextLng, geoStatus, detectLocation } = useCitizenContext();
  const { refreshPendingCount } = useOfflineSync();

  const lat = contextLat ?? 24.8200;
  const lng = contextLng ?? 92.7900;

  const [category, setCategory] = useState<IncidentCategory>('rescue');
  const [description, setDescription] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [attachedPhoto, setAttachedPhoto] = useState<File | null>(null);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);
  const [isQueuedOffline, setIsQueuedOffline] = useState<boolean>(false);

  // Form submission, media processing & error states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompressingMedia, setIsCompressingMedia] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Listen for background sync completion to update queued SOS view to live incident
  useEffect(() => {
    const handleReportSynced = (e: Event) => {
      const customEvent = e as CustomEvent<{ clientId: string; backendIncident: any }>;
      if (customEvent.detail && submittedIncidentId) {
        const { clientId, backendIncident } = customEvent.detail;
        if (clientId === submittedIncidentId) {
          setSubmittedIncidentId(backendIncident.id || (backendIncident as any)._id || clientId);
          setIsQueuedOffline(false);
          refreshIncidents();
        }
      }
    };

    const handleReportSyncFailed = (e: Event) => {
      const customEvent = e as CustomEvent<{ clientId: string }>;
      if (customEvent.detail && submittedIncidentId && customEvent.detail.clientId === submittedIncidentId) {
        setIsQueuedOffline(true);
      }
    };

    window.addEventListener('sos-report-synced', handleReportSynced);
    window.addEventListener('sos-report-sync-failed', handleReportSyncFailed);
    return () => {
      window.removeEventListener('sos-report-synced', handleReportSynced);
      window.removeEventListener('sos-report-sync-failed', handleReportSyncFailed);
    };
  }, [submittedIncidentId, refreshIncidents]);

  const categories: { key: IncidentCategory; labelKey: string; icon: React.ElementType; color: string }[] = [
    { key: 'rescue', labelKey: 'citizen.sosReport.floodRescue', icon: LifeBuoy, color: 'text-blue-600' },
    { key: 'medical', labelKey: 'citizen.sosReport.medicalEmergency', icon: Stethoscope, color: 'text-red-600' },
    { key: 'food', labelKey: 'citizen.sosReport.foodSupplies', icon: Utensils, color: 'text-amber-600' },
    { key: 'shelter', labelKey: 'citizen.sosReport.shelterRelief', icon: ShelterIcon, color: 'text-purple-600' },
    { key: 'water', labelKey: 'citizen.sosReport.drinkingWater', icon: LifeBuoy, color: 'text-cyan-600' },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isCompressingMedia) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    const sosDescription = description || (locationName ? `Emergency request for ${category} assistance at ${locationName}.` : `Emergency request for ${category} assistance.`);
    const zoneId = user?.zone_id || 'z-silchar';

    // Authenticated citizen real backend ID from context or localStorage session
    const realReporterId = user?.id || getStoredUser()?.id || undefined;

    const clientId = `sos-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;


    // Optional image compression prior to SOS submission
    let photoBase64: string | undefined = undefined;
    if (attachedPhoto) {
      setIsCompressingMedia(true);
      try {
        const compressed = await compressImage(attachedPhoto, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.7,
        });
        if (compressed) {
          photoBase64 = compressed;
        }
      } catch (compErr) {
        console.warn('Image compression error (non-blocking fallback):', compErr);
      } finally {
        setIsCompressingMedia(false);
      }
    }

    // Handle offline queue if network is disconnected
    if (!navigator.onLine) {
      const offlineItem = enqueueSosReport({
        id: clientId,
        client_id: clientId,
        category,
        severity: 'critical',
        description: sosDescription,
        lat,
        lng,
        zone_id: zoneId,
        reporter_id: realReporterId,
        photo_base64: photoBase64,
        title: `Emergency ${category.toUpperCase()} Request`,
      });
      setSubmittedIncidentId(offlineItem.id);
      setIsQueuedOffline(true);
      refreshPendingCount();
      setIsSubmitting(false);
      return;
    }

    // Standardized payload helper
    const payload = buildIncidentPayload({
      title: `Emergency ${category.toUpperCase()} Request`,
      category,
      severity: 'critical',
      description: sosDescription,
      lat,
      lng,
      locationName,
      zone_id: zoneId,
      reporter_id: realReporterId,
      photo_base64: photoBase64,
      client_id: clientId,
    });


    try {
      const result = await createIncident(payload, { idempotencyKey: clientId });
      if (result && (result.id || (result as any)._id)) {
        setSubmittedIncidentId(result.id || (result as any)._id);
        setIsQueuedOffline(false);
        refreshIncidents();
      } else {

        // Fallback to offline queue on API null/failure response
        const offlineItem = enqueueSosReport({
          id: clientId,
          client_id: clientId,
          category,
          severity: 'critical',
          description: sosDescription,
          lat,
          lng,
          zone_id: zoneId,
          reporter_id: realReporterId,
          photo_base64: photoBase64,
          title: payload.title,
        });
        setSubmittedIncidentId(offlineItem.id);
        setIsQueuedOffline(true);
        refreshPendingCount();

      }
    } catch (err: any) {
      console.error('SOS submission error:', err);
      // Fallback save to offline queue
      const offlineItem = enqueueSosReport({
        id: clientId,
        client_id: clientId,
        category,
        severity: 'critical',
        description: sosDescription,
        lat,
        lng,
        zone_id: zoneId,
        reporter_id: realReporterId,
        photo_base64: photoBase64,
        title: payload.title,
      });
      setSubmittedIncidentId(offlineItem.id);
      setIsQueuedOffline(true);
      refreshPendingCount();



    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation view
  if (submittedIncidentId) {
    const nearestShelter = getNearestShelter();

    return (
      <div className="space-y-5 animate-fadeIn">
        {/* Status Banner */}
        {isQueuedOffline ? (
          <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-2xl p-5 flex items-start gap-4 shadow-xl border border-amber-600/40">
            <div className="p-2.5 bg-amber-700/60 rounded-xl shrink-0">
              <WifiOff className="h-6 w-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider">
                {t('citizen.sosReport.queuedTitle', { defaultValue: 'SOS Saved Offline' })}
              </h2>
              <p className="text-xs text-amber-100/90 font-medium mt-1 leading-relaxed">
                {t('citizen.sosReport.queuedDesc', {
                  defaultValue:
                    'Your emergency alert is stored safely in your browser storage. It will automatically submit to emergency dispatch as soon as network connectivity is restored.',
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl p-5 flex items-start gap-4 shadow-xl border border-emerald-600/40">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider">{t('citizen.sosReport.successTitle')}</h2>
              <p className="text-xs text-emerald-100/90 font-medium mt-1 leading-relaxed">
                {t('citizen.sosReport.successDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Live Status Tracker */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
              {t('citizen.sosReport.liveEmergencyTracking')}
            </span>
            <Badge variant={isQueuedOffline ? 'warning' : 'danger'} size="sm" className="font-mono">
              Ref ID: {submittedIncidentId} {isQueuedOffline ? '(Queued)' : ''}
            </Badge>
          </div>

          <StatusStepper currentStatus="reported" />

          {isQueuedOffline ? (
            <p className="text-xs text-center text-amber-900 bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex items-center justify-center gap-2 font-medium">
              <Clock className="h-4 w-4 text-amber-700" />
              <span>
                {t('common.status')}: <strong className="uppercase text-amber-900 font-bold">Queued Offline</strong> · Saved on device until reconnect
              </span>
            </p>
          ) : (
            <p className="text-xs text-center text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {t('common.status')}: <strong className="uppercase text-red-600 font-bold">{t('common.reported')}</strong> · {t('citizen.sosReport.responseTeamAssigned')}
            </p>
          )}
        </div>

        {/* Shelter Suggestion */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShelterIcon className="h-4.5 w-4.5 text-blue-600" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {t('citizen.sosReport.recommendedShelter')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-mono">
              {t('common.open')}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">{nearestShelter.name}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{nearestShelter.location_name}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">{t('citizen.sosReport.capacity')}</span>
              <strong className="text-slate-900 font-mono">{nearestShelter.capacity - nearestShelter.current_occupancy} {t('citizen.home.bedsFree')}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">{t('citizen.sosReport.emergencyLine')}</span>
              <strong className="text-slate-900 font-mono">{nearestShelter.contact_number}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="primary"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            onClick={() => navigate('/citizen/home')}
          >
            <span>{t('citizen.sosReport.returnHome')}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="flex-1 border-slate-300 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            onClick={() => {
              setSubmittedIncidentId(null);
              setIsQueuedOffline(false);
              setErrorMsg(null);
            }}
          >
            {t('citizen.sosReport.reportAnother')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Banner — Matched exactly to Home.tsx Emergency Alert banner size */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-lg border border-red-500/40 relative overflow-hidden">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md shrink-0">
            <AlertTriangle className="h-5 w-5 text-white animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black uppercase tracking-wide text-white drop-shadow-sm truncate">
              {t('citizen.sosReport.title')}
            </h1>
            <p className="text-xs text-red-100 font-medium leading-tight truncate mt-0.5">
              {t('citizen.sosReport.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-500 text-red-900 rounded-2xl p-4 flex items-start gap-3 shadow-md animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-950">Submission Error</h3>
            <p className="text-xs text-red-800 mt-0.5 leading-relaxed font-medium">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
            <span>{t('citizen.sosReport.categoryStepLabel')}</span>
            <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.key;

              const getCategoryBadgeStyles = () => {
                switch (cat.key) {
                  case 'rescue': return 'bg-blue-100 text-blue-700 border-blue-200';
                  case 'medical': return 'bg-red-100 text-red-700 border-red-200';
                  case 'food': return 'bg-amber-100 text-amber-700 border-amber-200';
                  case 'shelter': return 'bg-purple-100 text-purple-700 border-purple-200';
                  case 'water': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
                  default: return 'bg-slate-100 text-slate-700 border-slate-200';
                }
              };

              return (
                <div
                  key={cat.key}
                  onClick={() => !isSubmitting && setCategory(cat.key)}
                  className={`cursor-pointer transition-all duration-200 rounded-2xl p-4 flex flex-col justify-between border ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600 shadow-md scale-[1.01]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  } ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${getCategoryBadgeStyles()}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                        {t('common.selected')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-900 tracking-wide">
                    {t(cat.labelKey, { defaultValue: cat.key })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location & Description */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-800">
              {t('citizen.sosReport.locationStepLabel')}
            </label>
            <div className="flex items-center gap-2">
              {geoStatus === 'detecting' && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  Detecting GPS...
                </span>
              )}
              {geoStatus === 'acquired' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 font-mono">
                  <Navigation className="h-3 w-3 text-emerald-600" />
                  GPS Locked ({lat.toFixed(4)}, {lng.toFixed(4)})
                </span>
              )}
              {(geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'timeout') && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-amber-600" />
                  {geoStatus === 'denied' ? 'Permission Denied' : 'GPS Unavailable'}
                </span>
              )}
              <button
                type="button"
                onClick={detectLocation}
                disabled={isSubmitting || geoStatus === 'detecting'}
                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refresh Geolocation"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${geoStatus === 'detecting' ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {t('citizen.sosReport.locationLabel')}
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={t('citizen.sosReport.locationPlaceholder')}
              disabled={isSubmitting}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-semibold shadow-xs disabled:opacity-60 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {t('citizen.sosReport.descriptionLabel')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('citizen.sosReport.descriptionPlaceholder')}
              disabled={isSubmitting}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium shadow-xs disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        {/* Media Attachments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
          <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
            {t('citizen.sosReport.attachMedia')}
          </label>

          <label className={`w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all bg-slate-50/60 hover:bg-blue-50/30 group ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200 text-slate-600 group-hover:text-blue-600 group-hover:scale-110 transition-all">
              <Camera className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {attachedPhoto ? (
                <span className="text-emerald-700 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="h-4 w-4" />
                  {attachedPhoto.name}
                </span>
              ) : (
                t('citizen.sosReport.takeAttachPhoto')
              )}
            </span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isSubmitting} className="hidden" />
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-red-600 via-red-700 to-rose-800 hover:from-red-700 hover:to-rose-900 disabled:from-red-400 disabled:to-red-400 text-white font-black text-xs sm:text-sm uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer border border-red-500/40 flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Transmitting SOS...</span>
            </>
          ) : (
            <>
              <PhoneCall className="h-5 w-5" />
              <span>{t('citizen.sosReport.submitSos')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};