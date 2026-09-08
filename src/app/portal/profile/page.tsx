import { getCurrentPatientOrRedirect } from '@/lib/currentPatient'
import { updateProfile } from './actions'

export default async function PortalProfilePage() {
  const { patient } = await getCurrentPatientOrRedirect()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
      <p className="mt-1 text-sm text-gray-500">
        {patient.user.email} &middot; DOB {new Date(patient.dateOfBirth).toLocaleDateString()} &middot; State:{' '}
        {patient.state}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Email, date of birth, and state of residence can&apos;t be changed here — contact support if these
        need to be corrected, since they affect licensure and identity verification.
      </p>

      <form action={updateProfile} className="mt-6 space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={patient.user.phone ?? ''}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            id="addressLine1"
            name="addressLine1"
            defaultValue={patient.addressLine1 ?? ''}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              id="city"
              name="city"
              defaultValue={patient.city ?? ''}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
              ZIP code
            </label>
            <input
              id="postalCode"
              name="postalCode"
              defaultValue={patient.postalCode ?? ''}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
              Emergency contact
            </label>
            <input
              id="emergencyContactName"
              name="emergencyContactName"
              defaultValue={patient.emergencyContactName ?? ''}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
              Emergency contact phone
            </label>
            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              defaultValue={patient.emergencyContactPhone ?? ''}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
        >
          Save changes
        </button>
      </form>
    </div>
  )
}
