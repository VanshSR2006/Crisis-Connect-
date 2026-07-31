import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCitizenContext } from '@/lib/citizenContext';
import { IncidentCategory, SeverityLevel } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatusStepper } from '@/components/shared/StatusStepper';
import { MapPlaceholder } from '@/components/shared/MapPlaceholder';
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
  FileCheck,
} from 'lucide-react';

export const SosReport: React.FC = () => {
  const navigate = useNavigate();
  const { addIncident, getNearestShelter } = useCitizenContext();

  const [category, setCategory] = useState<IncidentCategory>('rescue');
  const [description, setDescription] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('Civil Lines, Block B, Delhi');
  const [attachedPhoto, setAttachedPhoto] = useState<File | null>(null);
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);

  const categories: { key: IncidentCategory; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'rescue', label: 'Flood / Rescue', icon: LifeBuoy, color: 'text-blue-600' },
    { key: 'medical', label: 'Medical Emergency', icon: Stethoscope, color: 'text-red-600' },
    { key: 'landslide', label: 'Food & Supplies', icon: Utensils, color: 'text-amber-600' },
    { key: 'fire', label: 'Shelter Relief', icon: ShelterIcon, color: 'text-[#0f172a]' },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedPhoto(e.target.files[0]);
    }
  };

  const toggleVoiceNote = () => {
    setHasVoiceNote((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incident = addIncident({
      title: `Emergency ${category.toUpperCase()} Request`,
      description: description || `Emergency request for ${category} assistance at ${locationName}.`,
      category,
      severity: 'critical',
      location_name: locationName,
      photo: attachedPhoto,
      has_voice_note: hasVoiceNote,
    });

    setSubmittedIncidentId(incident.id);
  };

  // If submitted, show confirmation view with StatusStepper + Nearest Shelter
  if (submittedIncidentId) {
    const nearestShelter = getNearestShelter();

    return (
      <div className="space-y-5 animate-fadeIn">
        {/* Success Banner */}
        <div className="bg-emerald-900 text-white rounded p-4 flex items-start gap-3 shadow-md">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide">SOS Emergency Broadcast Sent</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Your request is live on the Emergency Command Network. Rescue units are being dispatched.
            </p>
          </div>
        </div>

        {/* Live Status Tracker */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#f0edef] pb-2">
            <span className="text-xs font-bold text-[#1b1b1d] uppercase tracking-[0.05em]">
              Live Emergency Tracking
            </span>
            <Badge variant="danger" size="sm">
              Ref ID: {submittedIncidentId}
            </Badge>
          </div>

          <StatusStepper currentStatus="reported" />

          <p className="text-xs text-center text-[#45464d] bg-[#f6f3f5] p-2 rounded border border-[#c6c6cd]">
            Status: <strong className="uppercase text-[#ba1a1a]">Reported</strong> · Response Team Assigned within 3–5 min
          </p>
        </div>

        {/* Nearest Evacuation Shelter Suggestion */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#f0edef] pb-2">
            <div className="flex items-center gap-2">
              <ShelterIcon className="h-4 w-4 text-[#2563eb]" />
              <span className="text-xs font-bold text-[#1b1b1d] uppercase tracking-[0.05em]">
                Recommended Safe Shelter
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              Open (Beds Free)
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
              <span className="text-[#76777d] text-[10px] block">Capacity</span>
              <strong className="text-[#1b1b1d]">{nearestShelter.capacity - nearestShelter.current_occupancy} beds available</strong>
            </div>
            <div>
              <span className="text-[#76777d] text-[10px] block">Emergency Line</span>
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
            <span>Return to Citizen Home</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="flex-1 border-[#c6c6cd] py-3 font-semibold text-xs uppercase tracking-wider text-[#1b1b1d]"
            onClick={() => {
              setSubmittedIncidentId(null);
              setDescription('');
            }}
          >
            Report Another Incident
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
          <h1 className="text-base font-bold uppercase tracking-wide">Emergency SOS Report Form</h1>
          <p className="text-xs text-red-100 mt-0.5">
            Select a category, describe your emergency, and submit to alert rescue teams immediately.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Category Selection Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d] block">
            1. Select Emergency Category <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.key;

              return (
                <Card
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`cursor-pointer transition-all border p-3 flex flex-col justify-between h-24 ${
                    isSelected
                      ? 'border-[#2563eb] bg-[#d5e3fc]/60 ring-2 ring-[#2563eb]'
                      : 'border-[#c6c6cd] bg-white hover:bg-[#f6f3f5]'
                  }`}
                >
                  <CardContent className="p-0 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-6 w-6 ${cat.color}`} />
                      {isSelected && <Badge variant="info" size="sm">Selected</Badge>}
                    </div>
                    <span className="text-xs font-bold text-[#1b1b1d] tracking-wide">
                      {cat.label}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 2: Location & Description */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-3 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d] block">
            2. Incident Location & Details
          </label>

          <Input
            label="Current GPS Location"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Address, block, or landmark..."
          />

          <div>
            <label className="block text-xs font-semibold text-[#1b1b1d] mb-1">
              Description / Special Assistance Needed
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the situation (e.g. trapped residents, water level rising, medical needs)..."
              className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
        </div>

        {/* Step 3: Optional Media & Voice Attachment */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-3 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d] block">
            3. Attach Photo / Voice Note (Optional)
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* Photo Attachment Button */}
            <label className="border border-dashed border-[#c6c6cd] hover:border-[#2563eb] rounded p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-colors bg-[#f6f3f5]">
              <Camera className="h-5 w-5 text-[#45464d]" />
              <span className="text-xs font-semibold text-[#1b1b1d]">
                {attachedPhoto ? attachedPhoto.name : 'Take/Attach Photo'}
              </span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            {/* Voice Note Button */}
            <button
              type="button"
              onClick={toggleVoiceNote}
              className={`border border-dashed rounded p-3 text-center flex flex-col items-center justify-center gap-1.5 transition-colors ${
                hasVoiceNote
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-[#c6c6cd] hover:border-[#2563eb] bg-[#f6f3f5] text-[#1b1b1d]'
              }`}
            >
              <Mic className={`h-5 w-5 ${hasVoiceNote ? 'text-emerald-600' : 'text-[#45464d]'}`} />
              <span className="text-xs font-semibold">
                {hasVoiceNote ? 'Voice Note Attached' : 'Record Voice Note'}
              </span>
            </button>
          </div>
        </div>

        {/* Step 4: Map Confirmation Preview */}
        <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
          <div className="px-3 py-2 border-b border-[#c6c6cd] flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#45464d]">
              Target Pin Preview
            </span>
            <span className="text-[10px] font-bold text-emerald-700">GPS Locked</span>
          </div>
          <MapPlaceholder height="h-32" />
        </div>

        {/* Big Submit Button */}
        <Button
          type="submit"
          variant="danger"
          fullWidth
          size="lg"
          className="bg-[#ba1a1a] hover:bg-[#991b1b] text-white font-black text-sm uppercase tracking-widest py-4 rounded shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <PhoneCall className="h-5 w-5" />
          <span>Send Emergency SOS Broadcast</span>
        </Button>
      </form>
    </div>
  );
};
