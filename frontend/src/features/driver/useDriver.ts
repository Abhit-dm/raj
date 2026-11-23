import { useQuery } from '@tanstack/react-query';
import { driverService } from '../../services/api';
import type { TranslationKey } from '../../i18n';

export type DriverDoc = {
  id: string; documentType: string; fileUrl: string; fileName: string; mimeType: string;
  verificationStatus: string; rejectionReason?: string | null; uploadedAt: string;
};

export type DriverVehicle = {
  id: string; category: string; manufacturer: string; model: string; registrationNumber: string;
  manufacturingYear: number; seatingCapacity: number; fuelType: string; colour: string; hasAC: boolean; verificationStatus: string;
};

export type FullDriver = {
  id: string; registrationId: string; fullName: string; firstName?: string | null; lastName?: string | null;
  profilePhotoUrl?: string | null; dateOfBirth?: string | null; mobileNumber: string;
  registrationType: 'DRIVER_ONLY' | 'DRIVER_WITH_VEHICLE'; verificationStatus: string;
  vehicleTypes: string[]; isAvailable: boolean; latitude?: number | null; longitude?: number | null;
  address?: { doorNumber: string; street: string; village: string; district: string; state: string; pinCode: string } | null;
  drivingLicence?: { licenceNumber: string; licenceClass: string; issuingAuthority: string; issueDate: string; expiryDate: string; stateOfIssue: string } | null;
  drivingExperience?: { totalYears: number; previousCompany?: string | null; preferredLocation?: string | null; willingLongDistance: boolean } | null;
  emergencyContact?: { contactName: string; contactNumber: string; relationship: string } | null;
  documents: DriverDoc[];
  vehicles: DriverVehicle[];
};

export const useDriver = () =>
  useQuery<FullDriver>({
    queryKey: ['driver-me'],
    queryFn: () => driverService.getMe().then((r) => r.data.data),
    staleTime: 30_000,
  });

export const requiredDocs = (d: Pick<FullDriver, 'registrationType'>) => {
  const docs = ['PROFILE_PHOTO', 'AADHAAR_CARD', 'DRIVING_LICENCE_FRONT', 'DRIVING_LICENCE_BACK'];
  if (d.registrationType === 'DRIVER_WITH_VEHICLE') docs.push('RC_BOOK');
  return docs;
};

const needsUpload = (doc?: DriverDoc) => !doc || doc.verificationStatus === 'RESUBMISSION_REQUIRED' || doc.verificationStatus === 'REJECTED';

export type TaskId = 'address' | 'licence' | 'documents' | 'vehicle' | 'experience' | 'emergency';
export type Task = { id: TaskId; label: TranslationKey; done: boolean; required: boolean; progress?: [number, number]; warn?: boolean };

/* The remaining registration steps shown on the driver's home screen (mirrors the server's submit check) */
export const driverTasks = (d: FullDriver): Task[] => {
  const req = requiredDocs(d);
  const okDocs = req.filter((type) => !needsUpload(d.documents.find((x) => x.documentType === type))).length;
  const docWarn = d.documents.some((x) => x.verificationStatus === 'RESUBMISSION_REQUIRED' || x.verificationStatus === 'REJECTED');
  const tasks: Task[] = [
    { id: 'address', label: 'task_address', done: !!d.address, required: true },
    { id: 'licence', label: 'task_licence', done: !!d.drivingLicence, required: true },
    { id: 'documents', label: 'task_documents', done: okDocs === req.length, required: true, progress: [okDocs, req.length], warn: docWarn },
  ];
  if (d.registrationType === 'DRIVER_WITH_VEHICLE') tasks.push({ id: 'vehicle', label: 'task_vehicle', done: d.vehicles.length > 0, required: true });
  tasks.push(
    { id: 'experience', label: 'task_experience', done: !!d.drivingExperience, required: false },
    { id: 'emergency', label: 'task_emergency', done: !!d.emergencyContact, required: false },
  );
  return tasks;
};
