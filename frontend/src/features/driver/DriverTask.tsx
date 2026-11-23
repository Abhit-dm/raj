/* One screen per remaining registration step (opened from the home checklist) */
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BottomAction, Btn, Field, ScreenTitle, SelectField, Spinner, TopBar } from '../../components/app/ui';
import { useToast } from '../../components/ui/Toast';
import { useT, type TranslationKey } from '../../i18n';
import { driverService, vehicleService, apiError } from '../../services/api';
import { INDIAN_STATES, VEHICLE_TYPES } from '../../config/vehicles';
import { cn } from '../../lib/utils';
import { useDriver, type FullDriver } from './useDriver';

type Values = Record<string, string>;
type FieldDef = {
  name: string; label: TranslationKey; type?: 'text' | 'date' | 'number' | 'tel' | 'select' | 'toggle';
  options?: readonly string[] | { value: string; label: string }[]; required?: boolean; pattern?: RegExp; inputMode?: 'numeric' | 'text' | 'tel';
  upper?: boolean; maxLength?: number;
};

const today = () => new Date().toISOString().slice(0, 10);
const dateOnly = (v?: string | null) => (v ? v.slice(0, 10) : '');

type TaskDef = {
  title: TranslationKey;
  fields: (d: FullDriver, t: (k: TranslationKey) => string) => FieldDef[];
  initial: (d: FullDriver) => Values;
  validate?: (v: Values) => Partial<Record<string, TranslationKey>>;
  save: (v: Values, d: FullDriver) => Promise<unknown>;
};

const TASKS: Record<string, TaskDef> = {
  address: {
    title: 'task_address',
    fields: () => [
      { name: 'doorNumber', label: 'door_no', required: true },
      { name: 'street', label: 'street', required: true },
      { name: 'village', label: 'city_village', required: true },
      { name: 'district', label: 'district', required: true },
      { name: 'state', label: 'state', type: 'select', options: INDIAN_STATES, required: true },
      { name: 'pinCode', label: 'pincode', required: true, pattern: /^\d{6}$/, inputMode: 'numeric', maxLength: 6 },
    ],
    initial: (d) => ({
      doorNumber: d.address?.doorNumber ?? '', street: d.address?.street ?? '', village: d.address?.village ?? '',
      district: d.address?.district ?? '', state: d.address?.state ?? '', pinCode: d.address?.pinCode ?? '',
    }),
    save: (v) => driverService.saveStep(1, { address: { doorNumber: v.doorNumber, street: v.street, village: v.village, district: v.district, state: v.state, pinCode: v.pinCode } }),
  },
  licence: {
    title: 'task_licence',
    fields: () => [
      { name: 'licenceNumber', label: 'licence_no', required: true, upper: true, pattern: /^[A-Z0-9 -]{8,20}$/ },
      { name: 'licenceClass', label: 'licence_class', type: 'select', required: true, options: [
        { value: 'LMV', label: 'LMV (car, jeep, van)' }, { value: 'MGV', label: 'MGV (medium goods)' },
        { value: 'HMV', label: 'HMV (heavy vehicle)' }, { value: 'HGMV', label: 'HGMV (heavy goods)' },
        { value: 'HPMV', label: 'HPMV (bus)' }, { value: 'TRANS', label: 'Transport (commercial)' }, { value: 'MCWG', label: 'MCWG (bike)' },
      ] },
      { name: 'issuingAuthority', label: 'issuing_authority', required: true },
      { name: 'stateOfIssue', label: 'state_of_issue', type: 'select', options: INDIAN_STATES, required: true },
      { name: 'issueDate', label: 'issue_date', type: 'date', required: true },
      { name: 'expiryDate', label: 'expiry_date', type: 'date', required: true },
    ],
    initial: (d) => ({
      licenceNumber: d.drivingLicence?.licenceNumber ?? '', licenceClass: d.drivingLicence?.licenceClass ?? '',
      issuingAuthority: d.drivingLicence?.issuingAuthority ?? '', stateOfIssue: d.drivingLicence?.stateOfIssue ?? '',
      issueDate: dateOnly(d.drivingLicence?.issueDate), expiryDate: dateOnly(d.drivingLicence?.expiryDate),
    }),
    validate: (v) => ({
      issueDate: v.issueDate && v.issueDate > today() ? 'something_wrong' : undefined,
      expiryDate: v.expiryDate && v.expiryDate <= today() ? 'doc_status_EXPIRED' : undefined,
    }),
    save: (v) => driverService.saveStep(2, { licence: { ...v, licenceNumber: v.licenceNumber.replace(/\s+/g, '') } }),
  },
  experience: {
    title: 'task_experience',
    fields: () => [
      { name: 'totalYears', label: 'years_experience', type: 'number', required: true, inputMode: 'numeric', pattern: /^\d{1,2}$/ },
      { name: 'preferredLocation', label: 'preferred_location' },
      { name: 'previousCompany', label: 'previous_company' },
      { name: 'willingLongDistance', label: 'long_distance', type: 'toggle' },
    ],
    initial: (d) => ({
      totalYears: d.drivingExperience ? String(d.drivingExperience.totalYears) : '',
      preferredLocation: d.drivingExperience?.preferredLocation ?? '',
      previousCompany: d.drivingExperience?.previousCompany ?? '',
      willingLongDistance: d.drivingExperience?.willingLongDistance ? '1' : '',
    }),
    save: (v, d) => driverService.saveStep(2, {
      experience: {
        totalYears: Number(v.totalYears), preferredLocation: v.preferredLocation || null, previousCompany: v.previousCompany || null,
        willingLongDistance: v.willingLongDistance === '1', languages: [], drivingCategories: d.vehicleTypes,
      },
    }),
  },
  emergency: {
    title: 'task_emergency',
    fields: () => [
      { name: 'contactName', label: 'contact_name', required: true },
      { name: 'contactNumber', label: 'contact_number', type: 'tel', required: true, pattern: /^[6-9]\d{9}$/, inputMode: 'numeric', maxLength: 10 },
      { name: 'relationship', label: 'relationship', type: 'select', required: true, options: ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend', 'Other'] },
    ],
    initial: (d) => ({
      contactName: d.emergencyContact?.contactName ?? '', contactNumber: d.emergencyContact?.contactNumber ?? '',
      relationship: d.emergencyContact?.relationship ?? '',
    }),
    save: (v) => driverService.saveStep(2, { emergencyContact: { contactName: v.contactName, contactNumber: v.contactNumber, relationship: v.relationship } }),
  },
  vehicle: {
    title: 'task_vehicle',
    fields: (d, t) => [
      { name: 'category', label: 'vehicle_type', type: 'select', required: true,
        options: VEHICLE_TYPES.filter((v) => d.vehicleTypes.length === 0 || d.vehicleTypes.includes(v.code)).map((v) => ({ value: v.code, label: t(v.key) })) },
      { name: 'registrationNumber', label: 'reg_no', required: true, upper: true, pattern: /^[A-Z0-9 -]{6,13}$/ },
      { name: 'manufacturer', label: 'make', required: true },
      { name: 'model', label: 'model', required: true },
      { name: 'manufacturingYear', label: 'year', type: 'number', required: true, inputMode: 'numeric', pattern: /^(19[89]\d|20\d\d)$/, maxLength: 4 },
      { name: 'seatingCapacity', label: 'seats', type: 'number', required: true, inputMode: 'numeric', pattern: /^\d{1,2}$/ },
      { name: 'fuelType', label: 'fuel', type: 'select', required: true, options: [{ value: 'DIESEL', label: 'Diesel' }, { value: 'PETROL', label: 'Petrol' }, { value: 'CNG', label: 'CNG' }, { value: 'ELECTRIC', label: 'Electric' }, { value: 'LPG', label: 'LPG' }] },
      { name: 'colour', label: 'colour', required: true },
      { name: 'hasAC', label: 'has_ac', type: 'toggle' },
    ],
    initial: (d) => {
      const v = d.vehicles[0];
      return {
        category: v?.category ?? d.vehicleTypes[0] ?? '', registrationNumber: v?.registrationNumber ?? '', manufacturer: v?.manufacturer ?? '',
        model: v?.model ?? '', manufacturingYear: v ? String(v.manufacturingYear) : '', seatingCapacity: v ? String(v.seatingCapacity) : '',
        fuelType: v?.fuelType ?? 'DIESEL', colour: v?.colour ?? '', hasAC: v?.hasAC ? '1' : '',
      };
    },
    save: (v, d) => {
      const body = { ...v, registrationNumber: v.registrationNumber.replace(/\s+/g, ''), manufacturingYear: Number(v.manufacturingYear), seatingCapacity: Number(v.seatingCapacity), hasAC: v.hasAC === '1' };
      return d.vehicles[0] ? vehicleService.update(d.vehicles[0].id, body) : vehicleService.create(body);
    },
  },
};

export const DriverTask = () => {
  const { task = '' } = useParams();
  const def = TASKS[task];
  const { data: d, isLoading } = useDriver();
  if (!def) return <Navigate to="/driver" replace />;
  if (isLoading || !d) return <><TopBar /><Spinner /></>;
  return <TaskForm key={task} def={def} driver={d} />;
};

const TaskForm = ({ def, driver }: { def: TaskDef; driver: FullDriver }) => {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [values, setValues] = useState<Values>(() => def.initial(driver));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const fields = def.fields(driver, t);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = (values[f.name] ?? '').trim();
    if (f.required && !v) errors[f.name] = t('required');
    else if (v && f.pattern && !f.pattern.test(v.toUpperCase())) errors[f.name] = t('something_wrong');
  }
  for (const [k, key] of Object.entries(def.validate?.(values) ?? {})) if (key && !errors[k]) errors[k] = t(key);

  const save = async () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      await def.save(values, driver);
      await qc.invalidateQueries({ queryKey: ['driver-me'] });
      toast.success(t('saved'));
      navigate('/driver', { replace: true });
    } catch (e) {
      toast.error(apiError(e, t('something_wrong')));
    } finally {
      setSaving(false);
    }
  };

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  return (
    <>
      <TopBar />
      <ScreenTitle title={t(def.title)} className="pt-1" />
      <div className="space-y-4 px-5 pb-4">
        {fields.map((f) => {
          const err = touched ? errors[f.name] : '';
          if (f.type === 'select') {
            return <SelectField key={f.name} label={t(f.label)} value={values[f.name] ?? ''} onChange={(v) => set(f.name, v)} options={f.options ?? []} error={err} />;
          }
          if (f.type === 'toggle') {
            const on = values[f.name] === '1';
            return (
              <ToggleRow key={f.name} on={on} onClick={() => set(f.name, on ? '' : '1')}>{t(f.label)}</ToggleRow>
            );
          }
          return (
            <Field
              key={f.name}
              label={t(f.label)}
              type={f.type === 'date' ? 'date' : f.type === 'tel' ? 'tel' : 'text'}
              inputMode={f.inputMode}
              maxLength={f.maxLength}
              value={values[f.name] ?? ''}
              onChange={(e) => set(f.name, f.upper ? e.target.value.toUpperCase() : e.target.value)}
              error={err}
            />
          );
        })}
      </div>
      <BottomAction><Btn onClick={save} loading={saving}>{t('save')}</Btn></BottomAction>
    </>
  );
};

export const ToggleRow = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className="pressable flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-left">
    <span className="text-[15px] font-semibold text-brand-navy">{children}</span>
    <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-brand-orange' : 'bg-slate-300')}>
      <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-6' : 'left-1')} />
    </span>
  </button>
);
