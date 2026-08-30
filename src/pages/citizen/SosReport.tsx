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
  Mic,
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
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);
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

  const toggleVoiceNote = () => {
    setHasVoiceNote((prev) => !prev);
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
          <div className="bg-amber-900 text-white rounded p-4 flex items-start gap-3 shadow-md border border-amber-700">
            <WifiOff className="h-6 w-6 text-amber-300 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide">
                {t('citizen.sosReport.queuedTitle', { defaultValue: 'SOS Saved Offline' })}
              </h2>
              <p className="text-xs text-amber-100 mt-1">
                {t('citizen.sosReport.queuedDesc', {
                  defaultValue:
                    'Your emergency alert is stored safely in your browser storage. It will automatically submit to emergency dispatch as soon as network connectivity is restored.',
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-900 text-white rounded p-4 flex items-start gap-3 shadow-md">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide">{t('citizen.sosReport.successTitle')}</h2>
              <p className="text-xs text-emerald-100 mt-1">
                {t('citizen.sosReport.successDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Live Status Tracker */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#f0edef] pb-2">
            <span className="text-xs font-bold text-[#1b1b1d] uppercase tracking-[0.05em]">
              {t('citizen.sosReport.liveEmergencyTracking')}
            </span>
            <Badge variant={isQueuedOffline ? 'warning' : 'danger'} size="sm">
              Ref ID: {submittedIncidentId} {isQueuedOffline ? '(Queued)' : ''}
            </Badge>
          </div>

          <StatusStepper currentStatus="reported" />

          {isQueuedOffline ? (
            <p className="text-xs text-center text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-300 flex items-center justify-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              <span>
                {t('common.status')}: <strong className="uppercase text-amber-800">Queued Offline</strong> · Saved on device until reconnect
              </span>
            </p>
          ) : (
            <p className="text-xs text-center text-[#45464d] bg-[#f6f3f5] p-2 rounded border border-[#c6c6cd]">
              {t('common.status')}: <strong className="uppercase text-[#ba1a1a]">{t('common.reported')}</strong> · {t('citizen.sosReport.responseTeamAssigned')}
            </p>
          )}
        </div>

        {/* Shelter Suggestion */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#f0edef] pb-2">
            <div className="flex items-center gap-2">
              <ShelterIcon className="h-4 w-4 text-[#2563eb]" />
              <span className="text-xs font-bold text-[#1b1b1d] uppercase tracking-[0.05em]">
                {t('citizen.sosReport.recommendedShelter')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              {t('common.open')}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#1b1b1d]">{nearestShelter.name}</h3>
            <p className="text-xs text-[#45464d] mt-0.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#76777d]" />
              <span>{nearestShelter.location_name}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-[#f6f3f5] p-2.5 rounded border border-[#c6c6cd]">
            <div>
              <span className="text-[#76777d] text-[10px] block">{t('citizen.sosReport.capacity')}</span>
              <strong className="text-[#1b1b1d]">{nearestShelter.capacity - nearestShelter.current_occupancy} {t('citizen.home.bedsFree')}</strong>
            </div>
            <div>
              <span className="text-[#76777d] text-[10px] block">{t('citizen.sosReport.emergencyLine')}</span>
              <strong className="text-[#1b1b1d]">{nearestShelter.contact_number}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            className="flex-1 bg-[#0f172a] hover:bg-[#1e293b] text-white py-3 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            onClick={() => navigate('/citizen/home')}
          >
            <span>{t('citizen.sosReport.returnHome')}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="flex-1 border-[#c6c6cd] py-3 font-semibold text-xs uppercase tracking-wider text-[#1b1b1d]"
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
      {/* Header Banner */}
      <div className="bg-[#ba1a1a] text-white rounded p-4 flex items-start gap-3 shadow-md">
        <AlertTriangle className="h-6 w-6 text-white flex-shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h1 className="text-base font-bold uppercase tracking-wide">{t('citizen.sosReport.title')}</h1>
          <p className="text-xs text-red-100 mt-0.5">
            {t('citizen.sosReport.subtitle')}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-500 text-red-900 rounded p-4 flex items-start gap-3 shadow-sm animate-fadeIn">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-950">Submission Error</h3>
            <p className="text-xs text-red-800 mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d] block">
            {t('citizen.sosReport.categoryStepLabel')} <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.key;

              return (
                <Card
                  key={cat.key}
                  onClick={() => !isSubmitting && setCategory(cat.key)}
                  className={`cursor-pointer transition-all border p-3 flex flex-col justify-between h-24 ${isSelected
                    ? 'border-[#2563eb] bg-[#d5e3fc]/60 ring-2 ring-[#2563eb]'
                    : 'border-[#c6c6cd] bg-white hover:bg-[#f6f3f5]'
                    } ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <CardContent className="p-0 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-6 w-6 ${cat.color}`} />
                      {isSelected && <Badge variant="info" size="sm">{t('common.selected')}</Badge>}
                    </div>
                    <span className="text-xs font-bold text-[#1b1b1d] tracking-wide">
                      {t(cat.labelKey, { defaultValue: cat.key })}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Location & Description */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d] block">
              {t('citizen.sosReport.locationStepLabel')}
            </label>
            <div className="flex items-center gap-1.5">
              {geoStatus === 'detecting' && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  Detecting GPS...
                </span>
              )}
              {geoStatus === 'acquired' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-emerald-600" />
                  GPS Locked ({lat.toFixed(4)}, {lng.toFixed(4)})
                </span>
              )}
              {(geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'timeout') && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-amber-600" />
                  {geoStatus === 'denied' ? 'Permission Denied' : 'GPS Unavailable'}
                </span>
              )}
              <button
                type="button"
                onClick={detectLocation}
                disabled={isSubmitting || geoStatus === 'detecting'}
                className="p-1 text-[#45464d] hover:text-[#2563eb] rounded hover:bg-[#f6f3f5] transition-colors"
                title="Refresh Geolocation"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${geoStatus === 'detecting' ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <Input
            label={t('citizen.sosReport.locationLabel')}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder={t('citizen.sosReport.locationPlaceholder')}
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-xs font-semibold text-[#1b1b1d] mb-1">
              {t('citizen.sosReport.descriptionLabel')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('citizen.sosReport.descriptionPlaceholder')}
              disabled={isSubmitting}
              className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-60"
            />
          </div>
        </div>

        {/* Media Attachments */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-3 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d] block">
            {t('citizen.sosReport.attachMedia')}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={`border border-dashed border-[#c6c6cd] hover:border-[#2563eb] rounded p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-colors bg-[#f6f3f5] ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}>
              <Camera className="h-5 w-5 text-[#45464d]" />
              <span className="text-xs font-semibold text-[#1b1b1d]">
                {attachedPhoto ? attachedPhoto.name : t('citizen.sosReport.takeAttachPhoto')}
              </span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isSubmitting} className="hidden" />
            </label>

            <button
              type="button"
              onClick={toggleVoiceNote}
              disabled={isSubmitting}
              className={`border border-dashed rounded p-3 text-center flex flex-col items-center justify-center gap-1.5 transition-colors ${hasVoiceNote
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-[#c6c6cd] hover:border-[#2563eb] bg-[#f6f3f5] text-[#1b1b1d]'
                } ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <Mic className={`h-5 w-5 ${hasVoiceNote ? 'text-emerald-600' : 'text-[#45464d]'}`} />
              <span className="text-xs font-semibold">
                {hasVoiceNote ? t('citizen.sosReport.voiceNoteAttached') : t('citizen.sosReport.recordVoiceNote')}
              </span>
            </button>
          </div>
        </div>

        {/* Submit Button */}

        <Button
          type="submit"
          variant="danger"
          fullWidth
          size="lg"
          disabled={isSubmitting}
          className="bg-[#ba1a1a] hover:bg-[#991b1b] disabled:bg-red-400 text-white font-black text-sm uppercase tracking-widest py-4 rounded shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
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
        </Button>
      </form>
    </div>
  );
};