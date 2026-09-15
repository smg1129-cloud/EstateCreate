import type { Questionnaire } from './types'

// The estate/asset intake. A comprehensive Florida estate-planning intake that
// collects what the coded document engine needs to assemble a complete plan
// while mirroring the firm's full client questionnaire (Sections A–AD). Many
// questions are informational: the engine surfaces every answer to the
// reviewing attorney, and wires the subset that changes generated document text
// into the document engine (see src/lib/documents/context.ts). Free-text and
// "unsure" answers are captured, never guessed at.
//
// Section and question ids are the stable contract consumed by the context
// builder — treat renaming one like a schema migration. Visibility is driven by
// triage answers on the matter and by answers within this questionnaire.

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
  id: 'estate-intake-fl-v2',
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
        { id: 'personal.phone', label: 'Best phone number', type: 'phone', half: true },
        { id: 'personal.occupation', label: 'Occupation and employer (or "retired" and former occupation)', help: 'Professional liability can affect how we protect assets.', type: 'short_text', half: true },
        { id: 'personal.gender', label: 'How should we refer to you in your documents?', type: 'select', options: [
          { value: 'he', label: 'He / him' },
          { value: 'she', label: 'She / her' },
          { value: 'they', label: 'They / them (gender-neutral)' },
        ], half: true },
        { id: 'personal.isUSCitizen', label: 'Are you a U.S. citizen?', help: 'Citizenship changes how much can pass to a spouse tax-free and may require a special trust.', type: 'boolean', required: true, half: true },
        { id: 'personal.floridaDomicile', label: 'Do you consider Florida your permanent home (domicile)?', type: 'boolean', required: true },
        { id: 'personal.priorState', label: 'Did you move to Florida from another state? If so, which state, and roughly when?', help: 'A prior state may still claim you for tax; a community-property state affects how assets are characterized.', type: 'short_text' },
        { id: 'personal.veteran', label: 'Are you a current or former member of the U.S. military?', help: 'Veterans may qualify for benefits that affect planning.', type: 'yesno_explain' },
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
        { id: 'spouse.marriageDate', label: 'Date of your marriage or partnership', type: 'date', half: true },
        { id: 'spouse.prenup', label: 'Do you have a prenuptial or postnuptial agreement?', help: 'Florida gives a surviving spouse rights that override a will unless they were properly waived.', type: 'yesno_explain' },
        { id: 'spouse.confidential', label: 'Is there anything you would want kept confidential from your spouse or partner?', help: 'Please answer honestly. If yes, we may not be able to represent you both jointly.', type: 'yesno_explain' },
        { id: 'spouse.hasOwnChildren', label: 'Does your spouse or partner have children from a prior relationship?', type: 'yesno_explain' },
        { id: 'spouse.priorPlan', label: 'Does your spouse or partner have their own estate plan? When was it last updated?', type: 'short_text' },
        { id: 'spouse.leaveEverythingToSpouse', label: 'Do you want everything to go to your spouse first, if they survive you?', type: 'boolean' },
        { id: 'spouse.trustToCarryOut', label: 'If you die first, do you trust your spouse to carry out your wishes for your children and other beneficiaries?', help: 'This is the central question in second-marriage planning. There is no wrong answer.', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ C
    {
      id: 'prior',
      title: 'Prior Marriages & Obligations',
      questions: [
        { id: 'prior.hadPriorMarriage', label: 'Have you been married before?', type: 'yesno_explain' },
        { id: 'prior.continuingObligations', label: 'Do you have continuing obligations from a prior marriage (alimony, child support, a requirement to maintain life insurance, a QDRO)?', help: 'A divorce decree can require you to leave assets to a former spouse or child, and it overrides your will.', type: 'yesno_explain', visibleWhen: { questionId: 'prior.hadPriorMarriage', equals: ['yes'] } },
        { id: 'prior.contractToMakeWill', label: 'Did any agreement require you to make a will, a joint/mutual will, or to leave specific property to someone?', help: 'A contract to make a will (Fla. Stat. 732.701) can trump your current wishes.', type: 'yesno_explain', visibleWhen: { questionId: 'prior.hadPriorMarriage', equals: ['yes'] } },
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
        { id: 'family.advancements', label: 'Have you already given significant money or property to one child and not others that should count against their share?', help: 'A written declaration is required for a gift to be charged against a share (Fla. Stat. 732.109).', type: 'yesno_explain' },
        { id: 'family.afterbornIntent', label: 'If a child is born or adopted after your documents are signed, should they be included?', type: 'boolean' },
        { id: 'family.disinherit', label: 'Do you want to intentionally leave a child out entirely?', help: 'This must be done deliberately and explicitly, by name.', type: 'yesno_explain' },
        { id: 'family.childrenAbroad', label: 'Do any of your children live outside the U.S. or are any non-U.S. citizens?', type: 'yesno_explain' },
        { id: 'family.deceasedChildShare', label: 'If a child dies before you, where should their share go?', type: 'select', options: [
          { value: 'per_stirpes', label: "To that child's children (per stirpes)" },
          { value: 'surviving', label: 'Split among my surviving children' },
        ] },
      ],
    },
    // ------------------------------------------------------------------ E
    {
      id: 'others',
      title: 'Others You Care About',
      questions: [
        { id: 'others.dependents', label: 'Is anyone financially dependent on you who is not a spouse or child (a parent, grandchild, or friend)?', type: 'yesno_explain' },
        { id: 'others.siblings', label: 'Do you have siblings, nieces, nephews, or others you want to include or exclude?', type: 'long_text' },
        { id: 'others.receiveNothing', label: 'Is there anyone you specifically want to receive nothing?', type: 'yesno_explain' },
        { id: 'others.promises', label: 'Is anyone likely to claim you promised them something?', type: 'yesno_explain' },
      ],
    },
    // ------------------------------------------------------------------ F/H/I/J asset summary
    {
      id: 'assets',
      title: 'Your Assets',
      description: 'We are looking for the general picture, not precise figures. This drives the funding schedule for a trust and helps your attorney spot issues.',
      questions: [
        { id: 'assets.homeOwn', label: 'Do you own your primary residence?', type: 'boolean' },
        { id: 'assets.homeAddress', label: 'Home address', type: 'short_text', visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] } },
        { id: 'assets.homeTitle', label: 'How is the deed titled?', help: 'How the deed reads controls what happens, regardless of what your will says.', type: 'select', visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] }, options: [
          { value: 'sole', label: 'My name alone' },
          { value: 'joint_spouse', label: 'Jointly with my spouse' },
          { value: 'joint_other', label: 'Jointly with someone else' },
          { value: 'trust', label: 'In a trust' },
          { value: 'life_estate', label: 'Life estate' },
        ] },
        { id: 'assets.homestead', label: 'Do you claim the Florida homestead exemption on this property?', type: 'boolean', visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] } },
        { id: 'assets.minorChildInHome', label: 'Does a minor child of yours live in the home?', help: 'If so, Florida law sharply restricts to whom you can leave the homestead.', type: 'boolean', visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] } },
        { id: 'assets.spouseWaivedHome', label: 'Has your spouse ever signed anything giving up rights to the home?', type: 'yesno_explain', visibleWhen: { questionId: 'assets.homeOwn', equals: ['true'] } },
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
            { id: 'owner', label: 'Policy owner', type: 'select', options: [
              { value: 'self', label: 'Me' },
              { value: 'spouse', label: 'My spouse' },
              { value: 'trust', label: 'A trust' },
              { value: 'other', label: 'Someone else' },
            ] },
            { id: 'beneficiary', label: 'Beneficiary', type: 'short_text' },
          ],
        },
        { id: 'assets.crypto', label: 'Do you own cryptocurrency or other significant digital assets?', help: 'If no one can find the keys, the value is simply gone.', type: 'yesno_explain' },
        { id: 'assets.digitalAssets', label: 'Do you own valuable online assets (domains, monetized channels, online stores)?', type: 'yesno_explain' },
        { id: 'assets.firearms', label: 'Do you own firearms?', help: 'Transferring a firearm to someone who cannot legally have it is a federal crime, even by inheritance. A gun trust may be appropriate.', type: 'yesno_explain' },
        { id: 'assets.firearmsCount', label: 'About how many firearms do you own?', type: 'number', visibleWhen: { questionId: 'assets.firearms', equals: ['yes'] }, half: true },
        { id: 'assets.firearmsNFA', label: 'Do any qualify as NFA items (suppressors, short-barreled rifles/shotguns, machine guns)?', help: 'NFA items require ATF approval to transfer; a gun trust is strongly recommended.', type: 'yesno_explain', visibleWhen: { questionId: 'assets.firearms', equals: ['yes'] } },
        { id: 'assets.firearmsRecipient', label: 'Who should receive your firearms, and are they legally permitted to possess them?', type: 'short_text', visibleWhen: { questionId: 'assets.firearms', equals: ['yes'] } },
        { id: 'assets.netWorthNote', label: 'Anything else about your assets your attorney should know?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ K business
    {
      id: 'business',
      title: 'Business Interests',
      visibleWhen: { questionId: 'triage.ownsBusiness', equals: ['true'] },
      questions: [
        {
          id: 'business.entities',
          label: 'Each business you own an interest in',
          type: 'group',
          fields: [
            { id: 'name', label: 'Business name', type: 'short_text' },
            { id: 'type', label: 'Type', type: 'select', options: [
              { value: 'llc', label: 'LLC' },
              { value: 's_corp', label: 'S-corporation' },
              { value: 'c_corp', label: 'C-corporation' },
              { value: 'partnership', label: 'Partnership' },
              { value: 'sole_prop', label: 'Sole proprietorship' },
            ] },
            { id: 'ownership', label: 'Your ownership %', type: 'short_text' },
            { id: 'value', label: 'Approx. value', type: 'money' },
          ],
        },
        { id: 'business.buySell', label: 'Is there an operating, shareholder, partnership, or buy-sell agreement?', help: 'A buy-sell agreement usually overrides your will as to that business interest.', type: 'yesno_explain' },
        { id: 'business.sCorp', label: 'Is any business an S corporation?', help: 'Only certain trusts may hold S-corp stock; a mistake can end the tax election.', type: 'yesno_explain' },
        { id: 'business.succession', label: 'If you died tomorrow, who would run the business, and do you want it sold, transferred to family, or continued by partners/employees?', type: 'long_text' },
        { id: 'business.childrenInvolved', label: 'Are any of your children involved in the business? Should they receive it (and the others be compensated with other assets)?', type: 'yesno_explain' },
        { id: 'business.personalGuarantee', label: 'Have you personally guaranteed any business debt or lease?', help: 'Personal guarantees survive you and can consume the estate.', type: 'yesno_explain' },
      ],
    },
    // ------------------------------------------------------------------ G foreign / out of state
    {
      id: 'foreign',
      title: 'Out-of-State & Foreign Connections',
      questions: [
        { id: 'foreign.foreignRE', label: 'Do you own real estate outside the United States?', help: 'Foreign property often needs a separate will under that country’s law.', type: 'yesno_explain' },
        { id: 'foreign.foreignAccounts', label: 'Do you have bank, brokerage, or retirement accounts outside the U.S.?', help: 'There are annual reporting requirements with severe penalties.', type: 'yesno_explain' },
        { id: 'foreign.foreignTrust', label: 'Do you have an interest in a foreign trust, foundation, or company?', type: 'yesno_explain' },
        { id: 'foreign.communityProperty', label: 'While married, did you ever live in a community-property state (AZ, CA, ID, LA, NV, NM, TX, WA, WI)?', help: 'Property acquired there may keep its community-property character in Florida.', type: 'yesno_explain' },
        { id: 'foreign.beneficiariesAbroad', label: 'Do any of your beneficiaries live abroad or are any non-U.S. citizens?', type: 'yesno_explain' },
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
    // ------------------------------------------------------------------ W charity
    {
      id: 'charity',
      title: 'Charitable Giving',
      questions: [
        {
          id: 'charity.gifts',
          label: 'Charitable gifts you want in your plan',
          type: 'group',
          fields: [
            { id: 'organization', label: 'Organization (exact legal name)', type: 'short_text' },
            { id: 'cityState', label: 'City / State', type: 'short_text' },
            { id: 'amount', label: 'Amount or %', type: 'short_text' },
            { id: 'purpose', label: 'Restricted purpose (or leave blank for unrestricted)', type: 'short_text' },
          ],
        },
        { id: 'charity.fromRetirement', label: 'Would you like charitable gifts to come from retirement accounts (often the most tax-efficient)?', type: 'yesno_explain' },
        { id: 'charity.plannedGiving', label: 'Are you interested in a donor-advised fund, private foundation, or a charitable trust that pays income to your family first?', type: 'yesno_explain' },
      ],
    },
    // ------------------------------------------------------------------ R residue
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
        { id: 'dist.simultaneousDeath', label: 'If you and your spouse died at the same time, whose plan should govern?', type: 'short_text', visibleWhen: { questionId: 'triage.maritalStatus', equals: ['married', 'partnered'] } },
      ],
    },
    // ------------------------------------------------------------------ S how beneficiaries receive
    {
      id: 'trustterms',
      title: 'How Beneficiaries Receive Their Inheritance',
      description: 'Outright, or in trust? A trust protects the money from creditors, divorce, and poor decisions, but adds administration.',
      questions: [
        { id: 'dist.howReceived', label: 'How should adult beneficiaries receive their share?', type: 'select', required: true, options: [
          { value: 'outright', label: 'Outright, once they are adults' },
          { value: 'staggered', label: 'In stages at certain ages (e.g. a third at 25, 30, 35)' },
          { value: 'lifetime_trust', label: 'In a lifetime protective trust (strongest asset/divorce protection)' },
        ] },
        { id: 'dist.stagedAges', label: 'If in stages, at what ages? (comma-separated, e.g. 25, 30, 35)', type: 'short_text', visibleWhen: { questionId: 'dist.howReceived', equals: ['staggered'] } },
        { id: 'dist.minorPotTrust', label: 'For minor beneficiaries, hold everything in one common "pot" trust until the youngest reaches a set age?', help: 'A single pot treats children like a family; separate shares treat them equally.', type: 'select', visibleWhen: { questionId: 'triage.hasMinorChildren', equals: ['true'] }, options: [
          { value: 'pot', label: 'One pot until the youngest reaches a set age' },
          { value: 'separate', label: 'Separate shares immediately' },
        ] },
        { id: 'dist.trusteeStandard', label: 'What should a trustee be able to spend trust money on?', type: 'select', visibleWhen: { questionId: 'dist.howReceived', equals: ['staggered', 'lifetime_trust'] }, options: [
          { value: 'broad', label: 'Broad discretion — whatever the trustee thinks is in the beneficiary’s best interest' },
          { value: 'hems', label: 'Health, education, maintenance, and support (HEMS)' },
        ] },
        { id: 'dist.divorceProtection', label: 'Should a beneficiary’s inheritance be protected from their divorce and creditors?', type: 'boolean' },
        { id: 'dist.beneficiaryAsTrustee', label: 'Should a beneficiary be able to become a trustee of their own trust at a certain age?', type: 'boolean', visibleWhen: { questionId: 'dist.howReceived', equals: ['lifetime_trust'] } },
        { id: 'dist.remainderPOA', label: 'When a beneficiary dies, who decides where their remaining trust share goes?', type: 'select', visibleWhen: { questionId: 'dist.howReceived', equals: ['staggered', 'lifetime_trust'] }, options: [
          { value: 'bloodline', label: 'It stays in my bloodline (my descendants)' },
          { value: 'limited', label: 'The beneficiary may appoint among my descendants and charities' },
          { value: 'broad', label: 'The beneficiary may leave it to anyone they choose' },
        ] },
        { id: 'dist.trustProtector', label: 'Would you like a "trust protector" who can replace a trustee or make limited fixes without going to court?', type: 'boolean', visibleWhen: { questionId: 'dist.howReceived', equals: ['staggered', 'lifetime_trust'] } },
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
            { id: 'isUSCitizen', label: 'U.S. citizen?', type: 'boolean' },
          ],
        },
        { id: 'fid.trustCompany', label: 'Would you consider a bank or trust company as trustee, now or as a backup?', type: 'yesno_explain' },
        { id: 'fid.trustProtectorName', label: 'If you want a trust protector, who should it be? (first choice, then a backup)', type: 'short_text' },
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
        { id: 'fid.compensation', label: 'Should your fiduciaries be paid, and if so, how much?', type: 'short_text' },
        { id: 'fid.familyStandard', label: 'Should a family member serving as fiduciary be forgiven for honest mistakes, rather than held to a professional standard?', type: 'boolean' },
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
        { id: 'minors.otherParentConcern', label: 'If the other parent is living, do you have concerns about them having custody?', help: 'A surviving parent normally has the right to custody; there are limits to what a will can do.', type: 'yesno_explain' },
        { id: 'minors.educationOffTop', label: 'Should college/education be paid before the estate is divided, or come out of each child’s own share?', type: 'select', options: [
          { value: 'off_top', label: 'Paid off the top for all' },
          { value: 'own_share', label: "Out of each child's share" },
        ] },
        { id: 'minors.tempCaregiver', label: 'Is there a temporary caregiver who should look after your children in the hours/days right after an emergency?', type: 'short_text' },
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
        { id: 'sn.advocate', label: 'Who should be their advocate or care coordinator (not necessarily the person handling the money)?', type: 'short_text' },
        { id: 'sn.ableAccount', label: 'Is there already an ABLE account or special needs trust for them?', type: 'yesno_explain' },
        { id: 'sn.letterOfIntent', label: 'Have you written down their routines, providers, medications, and what a good day looks like (a "letter of intent")?', type: 'boolean' },
        { id: 'sn.otherFamilyGifts', label: 'Are other family members leaving them money directly (which could undo the planning)?', type: 'yesno_explain' },
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
            { id: 'medical', label: 'Medical / special needs', type: 'short_text' },
          ],
        },
        { id: 'pets.trustAmount', label: 'Amount to set aside for their care (optional)', help: 'Florida allows an enforceable pet trust (Fla. Stat. 736.0408). A gift with no strings attached is not enforceable.', type: 'money' },
        { id: 'pets.enforcer', label: 'Who should make sure the money is actually used for the pets (an enforcer)?', type: 'short_text' },
        { id: 'pets.remainder', label: 'When the last pet dies, who should receive any money left over?', type: 'short_text' },
        { id: 'pets.instructions', label: 'Any instructions about veterinary care, diet, routine, or end-of-life decisions?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ AA incapacity / POA powers
    {
      id: 'poa',
      title: 'If You Cannot Manage Your Own Finances',
      description: 'Most people need these powers long before they need a will. Without them, your family may have to go to court to be appointed your guardian.',
      questions: [
        { id: 'poa.coAgents', label: 'If you name more than one financial agent, should they act together or one at a time?', type: 'select', options: [
          { value: 'one_at_a_time', label: 'One at a time (successor only when the prior cannot serve)' },
          { value: 'together', label: 'Together (must act jointly)' },
        ] },
        { id: 'poa.gifting', label: 'May your agent make gifts on your behalf (e.g. continuing your annual gifts to family or charity)?', help: 'In Florida, gifting powers must be granted specifically, or the agent simply cannot do it (Fla. Stat. 709.2202).', type: 'boolean' },
        { id: 'poa.realEstate', label: 'May your agent buy, sell, or manage your real estate, including your home?', type: 'boolean' },
        { id: 'poa.beneficiaryChanges', label: 'May your agent change beneficiary designations on your accounts and policies?', help: 'This is a powerful and dangerous authority. Grant it deliberately or not at all.', type: 'boolean' },
        { id: 'poa.trustPowers', label: 'May your agent create, amend, or revoke a trust for you?', type: 'boolean' },
        { id: 'poa.medicaidPlanning', label: 'May your agent do Medicaid / long-term-care planning, including transferring assets?', type: 'boolean' },
        { id: 'poa.digital', label: 'May your agent access your digital accounts?', type: 'boolean' },
        { id: 'poa.accounting', label: 'Should your agent have to account to anyone (a family member or accountant)?', type: 'yesno_explain' },
        { id: 'poa.incapacityPhysicians', label: 'If you have a trust, how many physicians should have to agree you cannot manage your affairs before a successor takes over?', type: 'select', options: [
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
          { value: 'doctor_family', label: 'A doctor plus a family member' },
        ] },
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
        { id: 'health.specificTreatments', label: 'How do you feel about specific treatments — a breathing machine, dialysis, CPR, antibiotics, surgery, blood transfusions?', type: 'long_text' },
        { id: 'health.dementiaWishes', label: 'If you developed dementia, what should guide your care as your wishes may change over time?', type: 'long_text' },
        { id: 'health.dnr', label: 'Do you want a Do Not Resuscitate order (a Florida yellow DNRO signed by you and your physician)?', type: 'yesno_explain' },
        { id: 'health.mentalHealth', label: 'Do you have wishes about mental-health treatment, including hospitalization or medication?', type: 'yesno_explain' },
        { id: 'health.organDonation', label: 'Do you want to be an organ, tissue, or eye donor?', type: 'select', options: [
          { value: 'yes_any', label: 'Yes — any needed organs and tissues' },
          { value: 'yes_transplant', label: 'Yes — for transplant only' },
          { value: 'no', label: 'No' },
        ] },
        { id: 'health.bodyDonation', label: 'Do you want to donate your body to medical science or a specific school?', type: 'yesno_explain' },
        { id: 'health.autopsy', label: 'Do you consent to an autopsy if one is requested?', type: 'select', options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'surrogate', label: 'Leave it to my surrogate' },
        ] },
        { id: 'health.visitors', label: 'Who should be allowed to visit you in the hospital, and is there anyone who should not?', type: 'long_text' },
        { id: 'health.hipaaRelease', label: 'Who may receive your medical information (HIPAA release)? List everyone.', type: 'long_text' },
        { id: 'health.wishes', label: 'Anything else you want your surrogate to know that would help them decide?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ AD final arrangements
    {
      id: 'final',
      title: 'Final Arrangements',
      questions: [
        { id: 'final.disposition', label: 'What are your wishes for the disposition of your remains?', type: 'select', options: [
          { value: 'burial', label: 'Burial' },
          { value: 'cremation', label: 'Cremation' },
          { value: 'donation', label: 'Body donation' },
          { value: 'undecided', label: 'Undecided / leave to my family' },
        ] },
        { id: 'final.location', label: 'Any specific cemetery, plot, or location?', type: 'short_text' },
        { id: 'final.prepaid', label: 'Have you prepaid or pre-arranged any funeral or burial services?', type: 'yesno_explain' },
        { id: 'final.agent', label: 'Who should have the legal authority to direct your funeral and the disposition of your remains?', type: 'short_text' },
        { id: 'final.instructions', label: 'Any wishes about your funeral, memorial service, or religious/cultural observances?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ AC long-term care
    {
      id: 'ltc',
      title: 'Long-Term Care & Aging',
      questions: [
        { id: 'ltc.insurance', label: 'Do you have long-term care insurance (or a hybrid life/LTC policy)?', type: 'yesno_explain' },
        { id: 'ltc.familyHistory', label: 'Is there a history of dementia or long illness in your family?', type: 'yesno_explain' },
        { id: 'ltc.homeCarePref', label: 'Do you expect or prefer to be cared for at home?', type: 'yesno_explain' },
        { id: 'ltc.plan', label: 'Have you thought about how you would pay for assisted living, memory care, or a nursing home?', type: 'long_text' },
      ],
    },
    // ------------------------------------------------------------------ Y taxes
    {
      id: 'taxes',
      title: 'Taxes & Larger Estates',
      description: 'Florida has no state estate or inheritance tax; the federal estate tax applies only to very large estates, but income-tax and basis planning matter for everyone.',
      questions: [
        { id: 'tax.priorGiftReturns', label: 'Have you ever filed a federal gift tax return (Form 709)?', type: 'yesno_explain' },
        { id: 'tax.largeGifts', label: 'Have you made gifts over the annual exclusion (currently $19,000 per person per year) to anyone?', type: 'yesno_explain' },
        { id: 'tax.expectGrowth', label: 'Do you expect your estate to grow substantially (a business sale, inheritance, or liquidity event)?', type: 'yesno_explain' },
        { id: 'tax.portability', label: 'If you are widowed, was a federal estate tax return filed for your late spouse to preserve their unused exemption (portability)?', help: 'Missing this can cost the family a great deal.', type: 'yesno_explain', visibleWhen: { questionId: 'triage.maritalStatus', equals: ['widowed'] } },
        { id: 'tax.existingStructures', label: 'Do you have any existing irrevocable trusts, family limited partnerships, or prior tax-planning structures?', type: 'yesno_explain' },
        { id: 'tax.advisors', label: 'Do you have a CPA, financial advisor, or insurance agent we should coordinate with?', type: 'short_text' },
      ],
    },
    // ------------------------------------------------------------------ Z asset protection
    {
      id: 'protection',
      title: 'Protecting Assets from Creditors & Lawsuits',
      questions: [
        { id: 'protect.sued', label: 'Are you concerned about being sued personally (e.g. a profession or business with liability exposure)?', type: 'yesno_explain' },
        { id: 'protect.umbrella', label: 'Do you carry umbrella liability insurance? How much?', help: 'Insurance is usually the first and cheapest line of defense.', type: 'yesno_explain' },
        { id: 'protect.tbe', label: 'If married, are your home and accounts held as tenants by the entireties?', help: 'In Florida this protects assets from a creditor of one spouse alone, but it disappears at the first death.', type: 'yesno_explain', visibleWhen: { questionId: 'triage.maritalStatus', equals: ['married'] } },
        { id: 'protect.recentTransfers', label: 'Have you transferred assets to family members or trusts in the last four years, or is any claim currently threatened?', help: 'Transfers made after a claim arises can be undone as fraudulent transfers — we need to know before moving anything.', type: 'yesno_explain' },
      ],
    },
    // ------------------------------------------------------------------ P expected inheritance
    {
      id: 'expect',
      title: 'What You Expect to Receive from Others',
      questions: [
        { id: 'expect.inherit', label: 'Do you expect to inherit from anyone (parents, relatives, a trust)?', type: 'yesno_explain' },
        { id: 'expect.beneficiaryOfTrust', label: 'Are you a beneficiary of any trust right now?', type: 'yesno_explain' },
        { id: 'expect.powerOfAppointment', label: 'Do you hold a power to direct where someone else’s trust assets go at your death (a "power of appointment")?', help: 'Your will may need to exercise it — or expressly not exercise it.', type: 'yesno_explain' },
      ],
    },
    // ------------------------------------------------------------------ O debts
    {
      id: 'debts',
      title: 'Debts & Obligations',
      questions: [
        {
          id: 'debts.list',
          label: 'Your significant debts',
          type: 'group',
          fields: [
            { id: 'creditor', label: 'Creditor', type: 'short_text' },
            { id: 'type', label: 'Type (mortgage, loan, card, tax)', type: 'short_text' },
            { id: 'balance', label: 'Approx. balance', type: 'money' },
            { id: 'securedBy', label: 'Secured by (if any)', type: 'short_text' },
          ],
        },
        { id: 'debts.familyLoans', label: 'Have you loaned money to family members? Should those loans be forgiven at your death or counted against their share?', help: 'A very common source of conflict — write down what you intend.', type: 'yesno_explain' },
        { id: 'debts.howPaid', label: 'How should your debts be paid?', type: 'select', options: [
          { value: 'residue', label: 'From the residue of my estate' },
          { value: 'with_asset', label: 'A beneficiary takes an asset subject to its debt' },
        ] },
        { id: 'debts.bankruptcy', label: 'Have you ever filed for bankruptcy, or do you owe back taxes / have judgments or liens?', type: 'yesno_explain' },
      ],
    },
    // ------------------------------------------------------------------ M digital
    {
      id: 'digital',
      title: 'Digital Life',
      questions: [
        { id: 'digital.executorAccess', label: 'What should your executor and agent be able to do with your digital accounts?', help: 'Florida’s Fiduciary Access to Digital Assets Act lets you grant this, but only if your documents say so.', type: 'select', options: [
          { value: 'full', label: 'Full access, including the content of communications' },
          { value: 'close_only', label: 'Close accounts only, without reading content' },
        ] },
        { id: 'digital.legacyContacts', label: 'Have you set up Apple Legacy Contact, Google Inactive Account Manager, or Facebook Legacy Contact?', type: 'yesno_explain' },
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
        { id: 'existing.trustFunded', label: 'If you have a trust, have all your assets actually been retitled into it?', help: 'An unfunded trust does almost nothing — this is the single most common failure we see.', type: 'yesno_explain', visibleWhen: { questionId: 'existing.hasTrust', equals: ['yes'] } },
        { id: 'existing.priorAttorney', label: 'Who prepared your current documents, and where are the originals kept?', type: 'short_text' },
        { id: 'existing.reasonNow', label: 'What made you decide to put a plan in place now?', type: 'long_text' },
        { id: 'existing.anythingElse', label: 'Is there anything else you want your attorney to know?', type: 'long_text' },
      ],
    },
  ],
}
