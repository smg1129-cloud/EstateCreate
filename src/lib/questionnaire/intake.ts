import type { Questionnaire } from './types'

// The estate/asset intake. This is a generation-focused distillation of the
// firm's full Florida client questionnaire: it collects exactly what the coded
// document engine needs to assemble a complete plan, while mirroring the source
// questionnaire's language, ordering, and "why we ask" notes. Free-text and
// "unsure" answers are captured and surfaced to the reviewing attorney rather
// than guessed at.
//
// Section visibility is driven by the triage answers already on the matter and
// by answers within this questionnaire (visibleWhen). Question ids are the
// stable contract consumed by src/lib/documents/context.ts.

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other relative / person' },
  { value: 'charity', label: 'Charity / organization' },
]

export const intakeQuestionnaire: Questionnaire = {
  id: 'estate-intake-fl-v1',
  kind: 'ESTATE_INTAKE',
  title: 'Estate & Asset Questionnaire',
  intro:
    'This packet is long on purpose — when you are finished, your attorney has what they need to prepare a complete plan. You do not have to answer every question; skip anything that does not apply or that you would rather discuss. Estimates are fine for values. Everything here is confidential and protected by attorney-client privilege.',
  sections: [
    // ------------------------------------------------------------------ A
    {
      id: 'personal',
      title: 'About You',
      questions: [
        { id: 'personal.fullName', label: 'Full legal name (including middle name and any suffix)', type: 'short_text', required: true },
        { id: 'personal.otherNames', label: 'Any other names that appear on titles, deeds, or accounts', help: 'Assets titled under an old name must be identified by that name.', type: 'short_text', half: true },
        { id: 'personal.dob', label: 'Date of birth', type: 'date', required: true, half: true },
        { id: 'personal.addressLine1', label: 'Primary residence — street address', type: 'short_text', required: true },
        { id: 'personal.city', label: 'City', type: 'short_text', required: true, half: true },
        { id: 'personal.county', label: 'County', help: 'Your county of residence is stated in your documents and determines where a probate would be filed.', type: 'short_text', required: true, half: true },
        { id: 'personal.state', label: 'State', type: 'state', required: true, half: true },
        { id: 'personal.postalCode', label: 'ZIP code', type: 'short_text', half: true },
        { id: 'personal.gender', label: 'How should we refer to you in your documents?', type: 'select', options: [
          { value: 'he', label: 'He / him' },
          { value: 'she', label: 'She / her' },
          { value: 'they', label: 'They / them (gender-neutral)' },
        ], half: true },
        { id: 'personal.isUSCitizen', label: 'Are you a U.S. citizen?', help: 'Citizenship changes how much can pass to a spouse tax-free and may require a special trust.', type: 'boolean', required: true, half: true },
        { id: 'personal.floridaDomicile', label: 'Do you consider Florida your permanent home (domicile)?', type: 'boolean', required: true },
        { id: 'personal.govBenefits', label: 'Do you receive any needs-based government benefits (SSI, Medicaid)?', help: 'Some benefits are lost if you receive an inheritance outright.', type: 'yesno_explain' },
      ],
    },
    // ------------------------------------------------------------------ B
    {
      id: 'spouse',
      title: 'Your Spouse or Partner',
      visibleWhen: { questionId: 'triage.maritalStatus', equals: ['married', 'partnered'] },
      questions: [
        { id: 'spouse.fullName', label: "Spouse's or partner's full legal name", type: 'short_text', required: true },
        { id: 'spouse.dob', label: 'Date of birth', type: 'date', half: true },
        { id: 'spouse.isUSCitizen', label: 'Is your spouse or partner a U.S. citizen?', help: 'Transfers to a non-citizen spouse do not qualify for the unlimited marital deduction and may need a special (QDOT) trust.', type: 'boolean', half: true },
        { id: 'spouse.isMarried', label: 'Are you legally married (as opposed to an unmarried partner)?', help: 'Florida gives a surviving spouse rights that an unmarried partner does not have.', type: 'boolean', required: true },
        { id: 'spouse.prenup', label: 'Do you have a prenuptial or postnuptial agreement?', help: 'Florida gives a surviving spouse rights that override a will unless they were properly waived.', type: 'yesno_explain' },
        { id: 'spouse.hasOwnChildren', label: 'Does your spouse or partner have children from a prior relationship?', type: 'yesno_explain' },
        { id: 'spouse.leaveEverythingToSpouse', label: 'Do you want everything to go to your spouse first, if they survive you?', type: 'boolean' },
      ],
    },
    // ------------------------------------------------------------------ C
    {
      id: 'prior',
      title: 'Prior Marriages & Obligations',
      questions: [
        { id: 'prior.hadPriorMarriage', label: 'Have you been married before?', type: 'yesno_explain' },
        { id: 'prior.continuingObligations', label: 'Do you have continuing obligations from a prior marriage (alimony, child support, a requirement to maintain life insurance, a QDRO)?', help: 'A divorce decree can require you to leave assets to a former spouse or child, and it overrides your will.', type: 'yesno_explain', visibleWhen: { questionId: 'prior.hadPriorMarriage', equals: ['yes'] } },
        { id: 'prior.formerSpouseBeneficiary', label: 'Is a former spouse still named as a beneficiary or fiduciary on any account, policy, or document?', type: 'yesno_explain', visibleWhen: { questionId: 'prior.hadPriorMarriage', equals: ['yes'] } },
      ],
    },
    // ------------------------------------------------------------------ D
    {
      id: 'children',
      title: 'Children & Descendants',
      description: 'Include every child: biological, adopted, from any relationship, living or deceased, minor or adult.',
      questions: [
        {
          id: 'family.children',
          label: 'Your children',
          help: 'A child left out by accident can upset the whole plan. A child left out on purpose has to be named.',
          type: 'group',
          fields: [
            { id: 'fullName', label: 'Full name', type: 'short_text', required: true },
            { id: 'dob', label: 'Date of birth', type: 'date' },
            { id: 'relationship', label: 'Relationship', type: 'select', options: [
              { value: 'biological', label: 'Biological' },
              { value: 'adopted', label: 'Adopted' },
              { value: 'step', label: 'Stepchild' },
            ] },
            { id: 'isMinor', label: 'Under 18?', type: 'boolean' },
            { id: 'deceased', label: 'Deceased?', type: 'boolean' },
            { id: 'specialNeeds', label: 'Has special needs / receives benefits?', type: 'boolean' },
          ],
        },
        { id: 'family.treatEqually', label: 'Do you want to treat all children equally?', help: 'Unequal treatment is perfectly legal. Writing down the reason helps prevent a fight.', type: 'yesno_explain' },
        { id: 'family.afterbornIntent', label: 'If a child is born or adopted after your documents are signed, should they be included?', type: 'boolean' },
        { id: 'family.disinherit', label: 'Do you want to intentionally leave a child out entirely?', help: 'This must be done deliberately and explicitly, by name.', type: 'yesno_explain' },
        { id: 'family.deceasedChildShare', label: 'If a child dies before you, where should their share go?', type: 'select', options: [
          { value: 'per_stirpes', label: "To that child's children (per stirpes)" },
          { value: 'surviving', label: 'Split among my surviving children' },
        ] },
      ],
    },
    // ------------------------------------------------------------------ F/H/I/J/K asset summary
    {
      id: 'assets',
      title: 'Your Assets',
      description: 'We are looking for the general picture, not precise figures. This drives the funding schedule for a trust and helps your attorney spot issues.',
      questions: [
        { id: 'assets.homeOwn', label: 'Do you own your primary residence?', type: 'boolean' },
        { id: 'assets.homeAddress', label: 'Home address', type: 'short_text', visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] } },
        { id: 'assets.homeTitle', label: 'How is the deed titled?', help: 'How the deed reads controls what happens, regardless of what your will says.', type: 'select', options: [
          { value: 'sole', label: 'My name alone' },
          { value: 'joint_spouse', label: 'Jointly with my spouse' },
          { value: 'joint_other', label: 'Jointly with someone else' },
          { value: 'trust', label: 'In a trust' },
          { value: 'life_estate', label: 'Life estate' },
        ], visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] } },
        { id: 'assets.homestead', label: 'Do you claim the Florida homestead exemption on this property?', type: 'boolean', visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] } },
        {
          id: 'assets.realEstate',
          label: 'Other real estate you own or co-own',
          type: 'group',
          fields: [
            { id: 'description', label: 'Address / description', type: 'short_text' },
            { id: 'state', label: 'State', type: 'state' },
            { id: 'title', label: 'How titled', type: 'short_text' },
            { id: 'value', label: 'Approx. value', type: 'money' },
          ],
        },
        {
          id: 'assets.accounts',
          label: 'Bank, investment, and retirement accounts',
          help: 'POD/TOD beneficiary designations and retirement beneficiary forms override your will — list them so we can coordinate.',
          type: 'group',
          fields: [
            { id: 'institution', label: 'Institution', type: 'short_text' },
            { id: 'type', label: 'Type', type: 'select', options: [
              { value: 'checking', label: 'Checking / savings' },
              { value: 'brokerage', label: 'Brokerage / investment' },
              { value: 'retirement', label: 'Retirement (401k/IRA/etc.)' },
              { value: 'other', label: 'Other' },
            ] },
            { id: 'value', label: 'Approx. value', type: 'money' },
            { id: 'beneficiary', label: 'Beneficiary named (POD/TOD)?', type: 'short_text' },
          ],
        },
        {
          id: 'assets.lifeInsurance',
          label: 'Life insurance policies',
          type: 'group',
          fields: [
            { id: 'company', label: 'Company', type: 'short_text' },
            { id: 'deathBenefit', label: 'Death benefit', type: 'money' },
            { id: 'beneficiary', label: 'Beneficiary', type: 'short_text' },
          ],
        },
        { id: 'assets.ownsBusiness', label: 'Do you own an interest in a business?', type: 'yesno_explain' },
        { id: 'assets.businessBuySell', label: 'Is there a buy-sell or shareholder agreement covering your interest?', help: 'A buy-sell agreement usually overrides your will as to that business interest.', type: 'yesno_explain', visibleWhen: { questionId: 'assets.ownsBusiness', equals: ['yes'] } },
        { id: 'assets.digitalAssets', label: 'Do you own cryptocurrency or other significant digital assets?', type: 'yesno_explain' },
        { id: 'assets.firearms', label: 'Do you own firearms?', help: 'Transferring a firearm to someone who cannot legally have it is a federal crime, even by inheritance. A gun trust may be appropriate.', type: 'yesno_explain' },
        { id: 'assets.netWorthNote', label: 'Anything else about your assets your attorney should know?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ E / R gifts
    {
      id: 'gifts',
      title: 'Specific Gifts',
      description: 'Fixed gifts of money or particular items to particular people or charities. Leave blank if you have none.',
      questions: [
        {
          id: 'gifts.specific',
          label: 'Specific gifts',
          type: 'group',
          fields: [
            { id: 'description', label: 'What (e.g. "$10,000" or "my wedding ring")', type: 'short_text', required: true },
            { id: 'recipient', label: 'Who receives it (full name or organization)', type: 'short_text', required: true },
            { id: 'recipientType', label: 'Recipient is', type: 'select', options: [
              { value: 'person', label: 'A person' },
              { value: 'charity', label: 'A charity / organization' },
            ] },
            { id: 'ifPredeceased', label: 'If they die before you', type: 'select', options: [
              { value: 'lapse', label: 'Gift returns to my estate' },
              { value: 'to_descendants', label: 'Goes to their descendants' },
            ] },
          ],
        },
        { id: 'gifts.personalPropertyMemo', label: 'Would you like a separate personal-property list you can update yourself, without a lawyer?', help: 'Florida lets you use a separate signed list for tangible personal items (Fla. Stat. 732.515), changeable any time.', type: 'boolean' },
      ],
    },
    // ------------------------------------------------------------------ R/S residue & how received
    {
      id: 'distribution',
      title: 'Who Gets What',
      description: 'This is the heart of it. Describe how you want your estate divided; we translate it into legal language.',
      questions: [
        { id: 'dist.narrative', label: 'In a sentence or two, describe how you want your estate divided.', type: 'long_text', required: true },
        {
          id: 'dist.residuary',
          label: 'Who receives everything left over (the residue), and in what shares?',
          help: 'Shares should add up to 100%. If you are married and want everything to your spouse first, list your spouse at 100% here and set the backup below.',
          type: 'group',
          minRows: 1,
          fields: [
            { id: 'name', label: 'Beneficiary (full name or organization)', type: 'short_text', required: true },
            { id: 'relationship', label: 'Relationship', type: 'select', options: RELATIONSHIP_OPTIONS },
            { id: 'sharePercent', label: 'Share (%)', type: 'number', required: true },
            { id: 'ifPredeceased', label: 'If they die before you', type: 'select', options: [
              { value: 'per_stirpes', label: 'Their descendants take their share (per stirpes)' },
              { value: 'others', label: 'Their share is divided among the other residuary beneficiaries' },
            ] },
          ],
        },
        { id: 'dist.ultimateBackstop', label: 'If everyone you have named has died before you, who should ultimately receive your estate?', help: 'Without a final backstop, the state decides. A charity or extended family are common choices.', type: 'short_text' },
        { id: 'dist.howReceived', label: 'How should adult beneficiaries receive their share?', type: 'select', required: true, options: [
          { value: 'outright', label: 'Outright, once they are adults' },
          { value: 'staggered', label: 'In stages at certain ages (e.g. a third at 25, 30, 35)' },
          { value: 'lifetime_trust', label: 'In a lifetime protective trust (strongest asset/divorce protection)' },
        ] },
        { id: 'dist.stagedAges', label: 'If in stages, at what ages? (comma-separated, e.g. 25, 30, 35)', type: 'short_text', visibleWhen: { questionId: 'dist.howReceived', equals: ['staggered'] } },
        { id: 'dist.minorPotTrust', label: 'For minor beneficiaries, hold everything in one common "pot" trust until the youngest reaches a set age?', help: 'A single pot treats children like a family; separate shares treat them equally.', type: 'select', options: [
          { value: 'pot', label: 'One pot until the youngest reaches a set age' },
          { value: 'separate', label: 'Separate shares immediately' },
        ], visibleWhen: { questionId: 'triage.hasMinorChildren', equals: ['true'] } },
        { id: 'dist.trusteeStandard', label: 'What should a trustee be able to spend trust money on?', type: 'select', options: [
          { value: 'broad', label: 'Broad discretion — whatever the trustee thinks is in the beneficiary’s best interest' },
          { value: 'hems', label: 'Health, education, maintenance, and support (HEMS)' },
        ], visibleWhen: { questionId: 'dist.howReceived', equals: ['staggered', 'lifetime_trust'] } },
        { id: 'dist.divorceProtection', label: 'Should a beneficiary’s inheritance be protected from their divorce and creditors?', type: 'boolean' },
      ],
    },
    // ------------------------------------------------------------------ T fiduciaries
    {
      id: 'fiduciaries',
      title: 'The People in Charge',
      description: 'Name a first choice and at least one backup for each role. They do not all have to be the same person.',
      questions: [
        {
          id: 'fid.personalRep',
          label: 'Personal Representative (executor) of your will',
          help: 'Florida restricts who may serve: a non-relative who lives out of state generally cannot be appointed. List in order of preference.',
          type: 'group',
          minRows: 1,
          fields: [
            { id: 'fullName', label: 'Full name', type: 'short_text', required: true },
            { id: 'relationship', label: 'Relationship', type: 'short_text' },
            { id: 'city', label: 'City', type: 'short_text' },
            { id: 'state', label: 'State', type: 'state' },
          ],
        },
        {
          id: 'fid.trustee',
          label: 'Trustee of your trust (if you are getting a trust)',
          type: 'group',
          fields: [
            { id: 'fullName', label: 'Full name', type: 'short_text', required: true },
            { id: 'relationship', label: 'Relationship', type: 'short_text' },
            { id: 'city', label: 'City', type: 'short_text' },
            { id: 'state', label: 'State', type: 'state' },
          ],
        },
        {
          id: 'fid.poaAgent',
          label: 'Agent under your financial power of attorney',
          help: 'In Florida a durable power of attorney is effective when signed (there is no springing version for most purposes), so choose carefully.',
          type: 'group',
          minRows: 1,
          fields: [
            { id: 'fullName', label: 'Full name', type: 'short_text', required: true },
            { id: 'relationship', label: 'Relationship', type: 'short_text' },
            { id: 'city', label: 'City', type: 'short_text' },
            { id: 'state', label: 'State', type: 'state' },
          ],
        },
        {
          id: 'fid.surrogate',
          label: 'Health care surrogate (medical decisions)',
          type: 'group',
          minRows: 1,
          fields: [
            { id: 'fullName', label: 'Full name', type: 'short_text', required: true },
            { id: 'relationship', label: 'Relationship', type: 'short_text' },
            { id: 'phone', label: 'Phone', type: 'phone' },
          ],
        },
        {
          id: 'fid.guardian',
          label: 'Guardian for your minor children',
          type: 'group',
          visibleWhen: { questionId: 'triage.hasMinorChildren', equals: ['true'] },
          fields: [
            { id: 'fullName', label: 'Full name', type: 'short_text', required: true },
            { id: 'relationship', label: 'Relationship', type: 'short_text' },
            { id: 'city', label: 'City', type: 'short_text' },
            { id: 'state', label: 'State', type: 'state' },
          ],
        },
        { id: 'fid.excluded', label: 'Is there anyone you specifically do NOT want serving in any role, or being appointed by a court?', help: 'We can name them and exclude them expressly.', type: 'yesno_explain' },
        { id: 'fid.bondWaived', label: 'Should your fiduciaries be allowed to serve without posting a bond?', help: 'Waiving bond is common for trusted family members and saves the estate money.', type: 'boolean' },
      ],
    },
    // ------------------------------------------------------------------ U minors
    {
      id: 'minors',
      title: 'Minor Children',
      visibleWhen: { questionId: 'triage.hasMinorChildren', equals: ['true'] },
      questions: [
        { id: 'minors.guardianMoneySamePerson', label: 'Should the person raising your children also manage their money?', type: 'select', options: [
          { value: 'same', label: 'Same person' },
          { value: 'different', label: 'Different people' },
        ] },
        { id: 'minors.educationOffTop', label: 'Should college/education be paid before the estate is divided, or come out of each child’s own share?', type: 'select', options: [
          { value: 'off_top', label: 'Paid off the top for all' },
          { value: 'own_share', label: "Out of each child's share" },
        ] },
        { id: 'minors.wishes', label: 'Any religious, educational, or lifestyle wishes for the guardian to follow?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ V special needs
    {
      id: 'specialneeds',
      title: 'Beneficiaries with Special Needs',
      visibleWhen: { questionId: 'triage.specialNeedsBeneficiary', equals: ['true'] },
      questions: [
        { id: 'sn.beneficiaryName', label: 'Name of the beneficiary with special needs', type: 'short_text' },
        { id: 'sn.receivesBenefits', label: 'Do they receive, or expect to receive, needs-based benefits (SSI/Medicaid)?', help: 'An outright inheritance can immediately disqualify them; a special needs trust avoids that.', type: 'boolean' },
        { id: 'sn.trusteeName', label: 'Who should manage money for them after you are gone?', type: 'short_text' },
        { id: 'sn.remainderOnDeath', label: 'What should happen to what is left in their trust when they die?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ X pets
    {
      id: 'pets',
      title: 'Pets',
      questions: [
        {
          id: 'pets.animals',
          label: 'Your pets',
          type: 'group',
          fields: [
            { id: 'name', label: 'Name', type: 'short_text' },
            { id: 'type', label: 'Type / breed', type: 'short_text' },
            { id: 'caregiver', label: 'Who should care for them', type: 'short_text' },
          ],
        },
        { id: 'pets.trustAmount', label: 'Amount to set aside for their care (optional)', help: 'Florida allows an enforceable pet trust (Fla. Stat. 736.0408). A gift with no strings attached is not enforceable.', type: 'money' },
      ],
    },
    // ------------------------------------------------------------------ AA incapacity / POA powers
    {
      id: 'poa',
      title: 'If You Cannot Manage Your Own Finances',
      description: 'Most people need these powers long before they need a will. Without them, your family may have to go to court to be appointed your guardian.',
      questions: [
        { id: 'poa.gifting', label: 'May your agent make gifts on your behalf (e.g. continuing your annual gifts to family or charity)?', help: 'In Florida, gifting powers must be granted specifically, or the agent simply cannot do it (Fla. Stat. 709.2202).', type: 'boolean' },
        { id: 'poa.realEstate', label: 'May your agent buy, sell, or manage your real estate, including your home?', type: 'boolean' },
        { id: 'poa.beneficiaryChanges', label: 'May your agent change beneficiary designations on your accounts and policies?', help: 'This is a powerful and dangerous authority. Grant it deliberately or not at all.', type: 'boolean' },
        { id: 'poa.trustPowers', label: 'May your agent create, amend, or revoke a trust for you?', type: 'boolean' },
        { id: 'poa.medicaidPlanning', label: 'May your agent do Medicaid / long-term-care planning, including transferring assets?', type: 'boolean' },
        { id: 'poa.digital', label: 'May your agent access your digital accounts?', type: 'boolean' },
      ],
    },
    // ------------------------------------------------------------------ AB health care
    {
      id: 'health',
      title: 'Health Care & End of Life',
      description: 'These are the hardest questions in the packet and the most important. Take your time.',
      questions: [
        { id: 'health.surrogateNow', label: 'Should your surrogate be able to help make decisions now, alongside you, or only when you cannot decide for yourself?', type: 'select', options: [
          { value: 'only_incapacity', label: 'Only when I cannot decide for myself' },
          { value: 'now_too', label: 'Also now, to help me' },
        ] },
        { id: 'health.lifeProlonging', label: 'If you had a terminal condition, an end-stage condition, or were in a persistent vegetative state, what would you want?', help: 'This is the core choice in a Florida living will (Fla. Stat. 765.303).', type: 'select', required: true, options: [
          { value: 'withhold', label: 'Withhold or withdraw life-prolonging procedures and let me die naturally' },
          { value: 'continue', label: 'Continue life-prolonging procedures' },
          { value: 'surrogate_decides', label: 'Let my surrogate decide at the time' },
        ] },
        { id: 'health.artificialNutrition', label: 'Do your wishes above include withholding artificial nutrition and hydration (feeding tube / IV fluids)?', type: 'boolean', visibleWhen: { questionId: 'health.lifeProlonging', equals: ['withhold'] } },
        { id: 'health.comfortCare', label: 'Do you want comfort care and pain relief even if it might shorten your life?', type: 'boolean' },
        { id: 'health.organDonation', label: 'Do you want to be an organ, tissue, or eye donor?', type: 'select', options: [
          { value: 'yes_any', label: 'Yes — any needed organs and tissues' },
          { value: 'yes_transplant', label: 'Yes — for transplant only' },
          { value: 'no', label: 'No' },
        ] },
        { id: 'health.hipaaRelease', label: 'Who may receive your medical information (HIPAA release)? List everyone.', type: 'long_text' },
        { id: 'health.wishes', label: 'Anything you want your surrogate to know that would help them decide?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ M digital / final
    {
      id: 'digital',
      title: 'Digital Life',
      questions: [
        { id: 'digital.executorAccess', label: 'What should your executor and agent be able to do with your digital accounts?', help: 'Florida’s Fiduciary Access to Digital Assets Act lets you grant this, but only if your documents say so.', type: 'select', options: [
          { value: 'full', label: 'Full access, including the content of communications' },
          { value: 'close_only', label: 'Close accounts only, without reading content' },
        ] },
        { id: 'digital.notes', label: 'Anything else about your digital life, subscriptions, or online accounts?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ Q existing docs
    {
      id: 'existing',
      title: 'Your Existing Documents & Final Notes',
      questions: [
        { id: 'existing.hasWill', label: 'Do you currently have a will?', type: 'yesno_explain' },
        { id: 'existing.hasTrust', label: 'Do you currently have a trust?', type: 'yesno_explain' },
        { id: 'existing.reasonNow', label: 'What made you decide to put a plan in place now?', type: 'long_text' },
        { id: 'existing.anythingElse', label: 'Is there anything else you want your attorney to know?', type: 'long_text' },
      ],
    },
  ],
}
