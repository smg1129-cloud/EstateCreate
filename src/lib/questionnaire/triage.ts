import type { Questionnaire } from './types'

// The "what do you need" questionnaire. Short by design: its only job is to
// identify the appropriate plan type (will-based vs trust-based) and the set of
// companion documents, which the rules engine (src/lib/documents/rules.ts)
// derives from these answers. The heavy asset/family detail comes later in the
// estate intake.

export const triageQuestionnaire: Questionnaire = {
  id: 'triage-fl-v1',
  kind: 'TRIAGE',
  title: 'Getting Started',
  intro:
    'A few quick questions so we can identify the right set of documents for your situation. There are no wrong answers, and everything is reviewed by a licensed Florida attorney before anything is finalized.',
  sections: [
    {
      id: 'goals',
      title: 'Your goals',
      questions: [
        {
          id: 'triage.reason',
          label: 'What brings you here today?',
          type: 'select',
          required: true,
          options: [
            { value: 'first_plan', label: 'I have never had an estate plan' },
            { value: 'update', label: 'I want to update or replace an existing plan' },
            { value: 'life_event', label: 'A life event (marriage, child, divorce, move to Florida)' },
            { value: 'incapacity', label: 'I mainly want to plan for possible incapacity' },
          ],
        },
        {
          id: 'triage.primaryGoal',
          label: 'Which best describes what matters most to you?',
          type: 'select',
          required: true,
          options: [
            { value: 'simple_will', label: 'A straightforward will to say who gets what' },
            { value: 'avoid_probate', label: 'Avoiding probate and keeping things private' },
            { value: 'control_timing', label: 'Controlling how and when beneficiaries receive assets' },
            { value: 'protect_beneficiary', label: 'Protecting a beneficiary (minor, special needs, creditor issues)' },
          ],
        },
      ],
    },
    {
      id: 'situation',
      title: 'Your situation',
      questions: [
        {
          id: 'triage.maritalStatus',
          label: 'What is your current marital status?',
          type: 'select',
          required: true,
          options: [
            { value: 'single', label: 'Single / never married' },
            { value: 'married', label: 'Married' },
            { value: 'partnered', label: 'In a committed relationship, not married' },
            { value: 'divorced', label: 'Divorced' },
            { value: 'widowed', label: 'Widowed' },
          ],
        },
        {
          id: 'triage.hasMinorChildren',
          label: 'Do you have any children under the age of 18?',
          help: 'This determines whether you need to name a guardian and whether Florida homestead restrictions apply.',
          type: 'boolean',
          required: true,
        },
        {
          id: 'triage.ownsRealEstate',
          label: 'Do you own a home or other real estate?',
          type: 'boolean',
          required: true,
        },
        {
          id: 'triage.ownsOutOfStateRealEstate',
          label: 'Do you own real estate in a state other than Florida?',
          help: 'Out-of-state property usually means a second probate in that state unless we plan around it — a trust often solves this.',
          type: 'boolean',
          required: true,
          visibleWhen: { questionId: 'triage.ownsRealEstate', equals: ['true'] },
        },
        {
          id: 'triage.ownsBusiness',
          label: 'Do you own all or part of a business (including a rental LLC)?',
          type: 'boolean',
          required: true,
        },
        {
          id: 'triage.netWorth',
          label: 'Roughly, what is your total net worth (including life insurance)?',
          type: 'select',
          required: true,
          options: [
            { value: 'under_500k', label: 'Under $500,000' },
            { value: '500k_2m', label: '$500,000 – $2 million' },
            { value: '2m_13m', label: '$2 million – $13 million' },
            { value: 'over_13m', label: 'Over $13 million' },
          ],
        },
      ],
    },
    {
      id: 'protections',
      title: 'Special considerations',
      questions: [
        {
          id: 'triage.specialNeedsBeneficiary',
          label:
            'Does anyone you want to provide for have a disability or receive needs-based government benefits (SSI, Medicaid)?',
          help: 'An outright inheritance can disqualify them from benefits. A special needs trust avoids that.',
          type: 'boolean',
          required: true,
        },
        {
          id: 'triage.wantsIncapacityDocs',
          label:
            'Would you like documents that let people you trust make financial and medical decisions if you cannot?',
          help: 'These are the durable power of attorney, health care surrogate, and living will. Most people need these long before they need a will.',
          type: 'boolean',
          required: true,
        },
        {
          id: 'triage.privacyImportant',
          label: 'Is keeping your affairs private (out of the public probate record) important to you?',
          type: 'boolean',
          required: true,
        },
      ],
    },
  ],
}
