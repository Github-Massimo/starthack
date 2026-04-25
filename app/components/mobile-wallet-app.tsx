"use client";

import { useDeferredValue, useEffect, useState } from "react";

type Role = "guest" | "partner" | "ops";
type TabId = "you" | "wallet" | "experiences" | "more";
type BatchStatus = "open" | "paid";
type ActivityTone = "credit" | "debit" | "neutral";
type PaymentStatus = "awaiting_settlement" | "batched" | "settled";
type StoreRequestStatus = "active" | "paid" | "expired";
type ExperienceFilter = "All" | "Deals" | "Travel" | "Fashion" | "Sport" | "Food" | "Wellness";
type ExperienceCategory = Exclude<ExperienceFilter, "All" | "Deals">;

type Company = {
  id: string;
  name: string;
  village: string;
  category: string;
};

type User = {
  id: string;
  name: string;
  role: Role;
  companyId?: string;
};

type GuestWallet = {
  userId: string;
  availableBalanceCents: number;
  lifetimePaidCents: number;
};

type CompanyAccount = {
  companyId: string;
  availableBalanceCents: number;
};

type Experience = {
  id: string;
  title: string;
  village: string;
  companyId: string;
  companyName: string;
  category: ExperienceCategory;
  priceCents: number;
  duration: string;
  tag: string;
  summary: string;
  offer: string;
  sustainable: boolean;
  isDeal: boolean;
  featured: boolean;
  maxCoinsPaidCents: number;
};

type Activity = {
  id: string;
  userId: string;
  title: string;
  detail: string;
  amountCents: number;
  tone: ActivityTone;
  timeLabel: string;
};

type Payment = {
  id: string;
  guestUserId: string;
  title: string;
  companyId: string;
  companyName: string;
  village: string;
  amountCents: number;
  cashPaidCents: number;
  pointsUsed: number;
  source: "experience" | "store_request";
  status: PaymentStatus;
  timeLabel: string;
  batchId?: string;
};

type StorePaymentRequest = {
  id: string;
  code: string;
  companyId: string;
  companyName: string;
  village: string;
  title: string;
  amountCents: number;
  status: StoreRequestStatus;
  createdAt: string;
  paidAt?: string;
  paidByUserId?: string;
};

type PointsEntrySource = "payment_cashback" | "hotel_booking" | "sustainability_bonus" | "redeemed";

type PointsEntry = {
  id: string;
  userId: string;
  kind: "earn" | "spend";
  source: PointsEntrySource;
  label: string;
  detail: string;
  points: number;
  remainingPoints?: number;
  timeLabel: string;
};

type HotelOffer = {
  id: string;
  name: string;
  village: string;
  amountCents: number;
  nights: number;
};

type HotelBooking = {
  id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  village: string;
  amountCents: number;
  nights: number;
  pointsAwarded: number;
  timeLabel: string;
};

type SustainabilityReward = {
  id: string;
  title: string;
  detail: string;
  referenceAmountCents: number;
};

type SustainabilityClaim = {
  id: string;
  userId: string;
  rewardId: string;
  timeLabel: string;
};

type SettlementBatch = {
  id: string;
  reference: string;
  status: BatchStatus;
  totalCents: number;
  createdAt: string;
  settledAt?: string;
  payouts: Array<{
    companyId: string;
    companyName: string;
    amountCents: number;
    count: number;
  }>;
};

type Notice = {
  tone: "default" | "success" | "warning";
  text: string;
};

type AppState = {
  platformCashCents: number;
  guestWallets: GuestWallet[];
  companyAccounts: CompanyAccount[];
  experiences: Experience[];
  activities: Activity[];
  payments: Payment[];
  pointsEntries: PointsEntry[];
  hotelBookings: HotelBooking[];
  sustainabilityClaims: SustainabilityClaim[];
  storeRequests: StorePaymentRequest[];
  batches: SettlementBatch[];
};

const companies: Company[] = [
  { id: "company-lift", name: "Grindelwald Lift Pass", village: "Grindelwald", category: "Mobility" },
  { id: "company-rental", name: "Murren Alpine Rentals", village: "Murren", category: "Gear" },
  { id: "company-cafe", name: "Lauterbrunnen Valley Café", village: "Lauterbrunnen", category: "Food" },
  { id: "company-spa", name: "Wengen Panorama Spa", village: "Wengen", category: "Wellness" }
];

const users: User[] = [
  { id: "guest-maya", name: "Maya Patel", role: "guest" },
  { id: "guest-jonas", name: "Jonas Fischer", role: "guest" },
  { id: "partner-lift-user", name: "Lift Team", role: "partner", companyId: "company-lift" },
  { id: "partner-rental-user", name: "Rental Team", role: "partner", companyId: "company-rental" },
  { id: "partner-cafe-user", name: "Café Team", role: "partner", companyId: "company-cafe" },
  { id: "ops-admin", name: "Ops Admin", role: "ops" }
];

const initialExperiences: Experience[] = [
  {
    id: "exp-jungfraujoch",
    title: "Jungfraujoch Snowline Pass",
    village: "Grindelwald",
    companyId: "company-lift",
    companyName: "Grindelwald Lift Pass",
    category: "Travel",
    priceCents: 6800,
    duration: "1 day access",
    tag: "Summit",
    summary: "Rail climb, glacier platform, panoramic access.",
    offer: "Save CHF 12",
    sustainable: true,
    isDeal: true,
    featured: true,
    maxCoinsPaidCents: 6800
  },
  {
    id: "exp-cliff",
    title: "First Cliff Walk Combo",
    village: "Grindelwald",
    companyId: "company-lift",
    companyName: "Grindelwald Lift Pass",
    category: "Sport",
    priceCents: 5400,
    duration: "Half day",
    tag: "Action",
    summary: "Cable car access with cliff route entry.",
    offer: "Weekend pick",
    sustainable: false,
    isDeal: true,
    featured: false,
    maxCoinsPaidCents: 5400
  },
  {
    id: "exp-rental",
    title: "Alpine Layer Pack",
    village: "Murren",
    companyId: "company-rental",
    companyName: "Murren Alpine Rentals",
    category: "Fashion",
    priceCents: 4200,
    duration: "Half day",
    tag: "Layered",
    summary: "Shell, gloves, goggles, and slope-ready extras.",
    offer: "Bundle value",
    sustainable: false,
    isDeal: true,
    featured: false,
    maxCoinsPaidCents: 4200
  },
  {
    id: "exp-brunch",
    title: "Valley Brunch Credit",
    village: "Lauterbrunnen",
    companyId: "company-cafe",
    companyName: "Lauterbrunnen Valley Café",
    category: "Food",
    priceCents: 1800,
    duration: "Flexible spend",
    tag: "Local",
    summary: "Morning café credit for pastries, brunch, and coffee.",
    offer: "Most booked",
    sustainable: true,
    isDeal: false,
    featured: false,
    maxCoinsPaidCents: 1800
  },
  {
    id: "exp-spa",
    title: "Panorama Recovery Session",
    village: "Wengen",
    companyId: "company-spa",
    companyName: "Wengen Panorama Spa",
    category: "Wellness",
    priceCents: 3600,
    duration: "45 minutes",
    tag: "Recharge",
    summary: "Sauna, stretch room, and fast recovery treatment.",
    offer: "Late arrival slot",
    sustainable: true,
    isDeal: false,
    featured: false,
    maxCoinsPaidCents: 3600
  },
  {
    id: "exp-stroll",
    title: "Lauterbrunnen Valley Rail Hop",
    village: "Lauterbrunnen",
    companyId: "company-lift",
    companyName: "Grindelwald Lift Pass",
    category: "Travel",
    priceCents: 2600,
    duration: "2 rides",
    tag: "Easy",
    summary: "Short-hop mobility pass between key valley stops.",
    offer: "New route",
    sustainable: true,
    isDeal: false,
    featured: false,
    maxCoinsPaidCents: 2600
  }
];

const experienceFilters: ExperienceFilter[] = [
  "All",
  "Deals",
  "Travel",
  "Fashion",
  "Sport",
  "Food",
  "Wellness"
];

const hotelOffers: HotelOffer[] = [
  {
    id: "hotel-eiger",
    name: "Eiger Panorama Lodge",
    village: "Grindelwald",
    amountCents: 150000,
    nights: 3
  },
  {
    id: "hotel-wengen",
    name: "Wengen Crest Hotel",
    village: "Wengen",
    amountCents: 118000,
    nights: 2
  }
];

const sustainabilityRewards: SustainabilityReward[] = [
  {
    id: "sustain-sbb",
    title: "Arrive by SBB",
    detail: "Low-emission arrival reward.",
    referenceAmountCents: 24000
  },
  {
    id: "sustain-cleaning",
    title: "Skip room cleaning",
    detail: "Reduce laundry and housekeeping impact.",
    referenceAmountCents: 9000
  },
  {
    id: "sustain-veg",
    title: "Choose vegetarian",
    detail: "Lower-impact meal option.",
    referenceAmountCents: 5000
  },
  {
    id: "sustain-offpeak",
    title: "Book off-peak slot",
    detail: "Helps smooth demand and capacity.",
    referenceAmountCents: 18000
  }
];

const initialPayments: Payment[] = [
  {
    id: "payment-a",
    guestUserId: "guest-maya",
    title: "Lift access pass",
    companyId: "company-lift",
    companyName: "Grindelwald Lift Pass",
    village: "Grindelwald",
    amountCents: 6200,
    cashPaidCents: 6200,
    pointsUsed: 0,
    source: "experience",
    status: "settled",
    timeLabel: "Yesterday",
    batchId: "batch-1"
  },
  {
    id: "payment-b",
    guestUserId: "guest-jonas",
    title: "Valley brunch credit",
    companyId: "company-cafe",
    companyName: "Lauterbrunnen Valley Café",
    village: "Lauterbrunnen",
    amountCents: 2800,
    cashPaidCents: 2800,
    pointsUsed: 0,
    source: "store_request",
    status: "settled",
    timeLabel: "Yesterday",
    batchId: "batch-1"
  },
  {
    id: "payment-c",
    guestUserId: "guest-maya",
    title: "Alpine Layer Pack",
    companyId: "company-rental",
    companyName: "Murren Alpine Rentals",
    village: "Murren",
    amountCents: 4200,
    cashPaidCents: 4200,
    pointsUsed: 0,
    source: "experience",
    status: "awaiting_settlement",
    timeLabel: "Now"
  }
];

const initialStoreRequests: StorePaymentRequest[] = [
  {
    id: "request-cafe-1",
    code: "JW-CAFE-1847",
    companyId: "company-cafe",
    companyName: "Lauterbrunnen Valley Café",
    village: "Lauterbrunnen",
    title: "Valley lunch tab",
    amountCents: 2200,
    status: "active",
    createdAt: "Now"
  },
  {
    id: "request-lift-1",
    code: "JW-LIFT-1201",
    companyId: "company-lift",
    companyName: "Grindelwald Lift Pass",
    village: "Grindelwald",
    title: "Lift desk upgrade",
    amountCents: 2800,
    status: "paid",
    createdAt: "Yesterday",
    paidAt: "Yesterday",
    paidByUserId: "guest-maya"
  }
];

const initialHotelBookings: HotelBooking[] = [
  {
    id: "booking-1",
    userId: "guest-maya",
    hotelId: "hotel-eiger",
    hotelName: "Eiger Panorama Lodge",
    village: "Grindelwald",
    amountCents: 150000,
    nights: 3,
    pointsAwarded: 15000,
    timeLabel: "Yesterday"
  }
];

const initialSustainabilityClaims: SustainabilityClaim[] = [
  {
    id: "claim-1",
    userId: "guest-maya",
    rewardId: "sustain-sbb",
    timeLabel: "Yesterday"
  }
];

const initialPointsEntries: PointsEntry[] = [
  {
    id: "points-hotel-1",
    userId: "guest-maya",
    kind: "earn",
    source: "hotel_booking",
    label: "Eiger Panorama Lodge",
    detail: "Hotel booking reward",
    points: 15000,
    remainingPoints: 15000,
    timeLabel: "Yesterday"
  },
  {
    id: "points-sustain-1",
    userId: "guest-maya",
    kind: "earn",
    source: "sustainability_bonus",
    label: "Arrive by SBB",
    detail: "Sustainable choice bonus",
    points: 1200,
    remainingPoints: 1200,
    timeLabel: "Yesterday"
  },
  {
    id: "points-cashback-1",
    userId: "guest-maya",
    kind: "earn",
    source: "payment_cashback",
    label: "Lift access pass",
    detail: "2% cashback in points",
    points: 124,
    remainingPoints: 124,
    timeLabel: "Yesterday"
  },
  {
    id: "points-cashback-2",
    userId: "guest-maya",
    kind: "earn",
    source: "payment_cashback",
    label: "Alpine Layer Pack",
    detail: "2% cashback in points",
    points: 84,
    remainingPoints: 84,
    timeLabel: "Now"
  },
  {
    id: "points-cashback-3",
    userId: "guest-jonas",
    kind: "earn",
    source: "payment_cashback",
    label: "Valley brunch credit",
    detail: "2% cashback in points",
    points: 56,
    remainingPoints: 56,
    timeLabel: "Yesterday"
  }
];

const initialBatches: SettlementBatch[] = [
  {
    id: "batch-1",
    reference: "SET-2026-001",
    status: "paid",
    totalCents: 9000,
    createdAt: "Yesterday",
    settledAt: "Yesterday",
    payouts: [
      {
        companyId: "company-lift",
        companyName: "Grindelwald Lift Pass",
        amountCents: 6200,
        count: 1
      },
      {
        companyId: "company-cafe",
        companyName: "Lauterbrunnen Valley Café",
        amountCents: 2800,
        count: 1
      }
    ]
  }
];

function buildCompanyAccounts(payments: Payment[]) {
  return companies.map((company) => ({
    companyId: company.id,
    availableBalanceCents: payments
      .filter((payment) => payment.companyId === company.id && payment.status === "settled")
      .reduce((sum, payment) => sum + payment.amountCents, 0)
  }));
}

const initialState: AppState = {
  platformCashCents: 39200,
  guestWallets: [
    {
      userId: "guest-maya",
      availableBalanceCents: 10600,
      lifetimePaidCents: 10400
    },
    {
      userId: "guest-jonas",
      availableBalanceCents: 11200,
      lifetimePaidCents: 2800
    }
  ],
  companyAccounts: buildCompanyAccounts(initialPayments),
  experiences: initialExperiences,
  activities: [
    {
      id: "act-1",
      userId: "guest-maya",
      title: "Wallet top-up",
      detail: "Open Banking",
      amountCents: 18000,
      tone: "credit",
      timeLabel: "Today"
    },
    {
      id: "act-2",
      userId: "guest-maya",
      title: "Grindelwald Lift Pass",
      detail: "Paid • +124 pts",
      amountCents: -6200,
      tone: "debit",
      timeLabel: "Yesterday"
    },
    {
      id: "act-3",
      userId: "guest-maya",
      title: "Murren Alpine Rentals",
      detail: "Paid • +84 pts",
      amountCents: -4200,
      tone: "debit",
      timeLabel: "Now"
    },
    {
      id: "act-4",
      userId: "guest-jonas",
      title: "Wallet top-up",
      detail: "SEPA Instant",
      amountCents: 14000,
      tone: "credit",
      timeLabel: "Yesterday"
    },
    {
      id: "act-5",
      userId: "guest-jonas",
      title: "Lauterbrunnen Valley Café",
      detail: "Paid • +56 pts",
      amountCents: -2800,
      tone: "debit",
      timeLabel: "Yesterday"
    },
    {
      id: "act-6",
      userId: "guest-maya",
      title: "Eiger Panorama Lodge",
      detail: "Booked • +15,000 pts",
      amountCents: 0,
      tone: "neutral",
      timeLabel: "Yesterday"
    },
    {
      id: "act-7",
      userId: "guest-maya",
      title: "Arrive by SBB",
      detail: "Sustainable choice • +1,200 pts",
      amountCents: 0,
      tone: "neutral",
      timeLabel: "Yesterday"
    }
  ],
  payments: initialPayments,
  pointsEntries: initialPointsEntries,
  hotelBookings: initialHotelBookings,
  sustainabilityClaims: initialSustainabilityClaims,
  storeRequests: initialStoreRequests,
  batches: initialBatches
};

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency: "CHF"
  }).format(amountCents / 100);
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeRequestCode(companyName: string) {
  const companySlug = companyName.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "JW";
  return `JW-${companySlug}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildQrCells(seed: string) {
  const size = 21;
  return Array.from({ length: size * size }, (_, index) => {
    const value = seed.charCodeAt(index % seed.length) + index * 17 + seed.length * 13;
    return value % 5 === 0 || value % 7 === 0;
  });
}

function pointsValueCents(points: number) {
  return points;
}

function ratePointsForAmount(amountCents: number, rateBps: number) {
  return Math.round(amountCents * (rateBps / 10000));
}

function cashbackPointsForPayment(cashPaidCents: number, rateBps = 200) {
  return ratePointsForAmount(cashPaidCents, rateBps);
}

function hotelRewardPoints(amountCents: number) {
  return Math.round(amountCents * 0.1);
}

function sustainabilityActionPoints(amountCents: number) {
  return ratePointsForAmount(amountCents, 500);
}

function availablePointsForUser(entries: PointsEntry[], userId: string) {
  return entries
    .filter((entry) => entry.userId === userId && entry.kind === "earn")
    .reduce((sum, entry) => sum + (entry.remainingPoints ?? 0), 0);
}

function addPointsEntry(
  entries: PointsEntry[],
  entry: Omit<PointsEntry, "id">
) {
  return [
    ...entries,
    {
      ...entry,
      id: makeId("points")
    }
  ];
}

function redeemPointsEntries(entries: PointsEntry[], userId: string, pointsToRedeem: number) {
  if (pointsToRedeem <= 0) {
    return entries;
  }

  let remainingToRedeem = pointsToRedeem;
  return entries.map((entry) => {
    if (
      remainingToRedeem === 0 ||
      entry.userId !== userId ||
      entry.kind !== "earn" ||
      (entry.remainingPoints ?? 0) <= 0
    ) {
      return entry;
    }

    const redeemFromEntry = Math.min(entry.remainingPoints ?? 0, remainingToRedeem);
    remainingToRedeem -= redeemFromEntry;
    return {
      ...entry,
      remainingPoints: (entry.remainingPoints ?? 0) - redeemFromEntry
    };
  });
}

function amountClass(tone: ActivityTone) {
  if (tone === "credit") return "amount amount-credit";
  if (tone === "debit") return "amount amount-debit";
  return "amount amount-neutral";
}

function paymentStatusLabel(status: PaymentStatus) {
  if (status === "awaiting_settlement") return "Awaiting";
  if (status === "batched") return "Batched";
  return "Settled";
}

function storeRequestStatusLabel(status: StoreRequestStatus) {
  if (status === "active") return "Open";
  if (status === "paid") return "Paid";
  return "Expired";
}

function roleLabel(role: Role) {
  if (role === "guest") return "Guest";
  if (role === "partner") return "Company";
  return "Ops";
}

function defaultTabForRole(role: Role): TabId {
  if (role === "guest") return "wallet";
  return "you";
}

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "you", label: "You", icon: "◎" },
  { id: "wallet", label: "Wallet", icon: "◉" },
  { id: "experiences", label: "Experiences", icon: "◇" },
  { id: "more", label: "More", icon: "▣" }
];

export function MobileWalletApp() {
  const [state, setState] = useState<AppState>(initialState);
  const [activeTab, setActiveTab] = useState<TabId>("wallet");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>({
    tone: "default",
    text: "Choose a demo account."
  });
  const [topUpAmount, setTopUpAmount] = useState("50");
  const [topUpRail, setTopUpRail] = useState("Open Banking");
  const [usePointsOnNextPayment, setUsePointsOnNextPayment] = useState(true);
  const [experienceSearch, setExperienceSearch] = useState("");
  const [activeExperienceFilter, setActiveExperienceFilter] = useState<ExperienceFilter>("All");
  const [showScanPanel, setShowScanPanel] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [storeRequestTitle, setStoreRequestTitle] = useState("Counter payment");
  const [storeRequestAmount, setStoreRequestAmount] = useState("18");
  const [selectedExperienceForCheckout, setSelectedExperienceForCheckout] = useState<Experience | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<"no-points" | "some-points" | "max-coins" | null>(null);
  const [checkoutPointsAmount, setCheckoutPointsAmount] = useState(0);
  const [newExperienceTitle, setNewExperienceTitle] = useState("");
  const [newExperienceCategory, setNewExperienceCategory] = useState<ExperienceCategory>("Travel");
  const [newExperiencePrice, setNewExperiencePrice] = useState("49");
  const [newExperienceDuration, setNewExperienceDuration] = useState("Half day");
  const [newExperienceTag, setNewExperienceTag] = useState("New");
  const [newExperienceOffer, setNewExperienceOffer] = useState("New drop");
  const [newExperienceSummary, setNewExperienceSummary] = useState("");
  const [newExperienceMaxCoins, setNewExperienceMaxCoins] = useState("49");
  const [newExperienceSustainable, setNewExperienceSustainable] = useState(false);
  const [newExperienceFeatured, setNewExperienceFeatured] = useState(false);
  const deferredExperienceSearch = useDeferredValue(experienceSearch);

  useEffect(() => {
    const stored = window.localStorage.getItem("jungfrau-wallet-user");
    if (stored) {
      const user = users.find((entry) => entry.id === stored);
      if (user) {
        setCurrentUserId(user.id);
        setActiveTab(defaultTabForRole(user.role));
      }
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      window.localStorage.setItem("jungfrau-wallet-user", currentUserId);
    } else {
      window.localStorage.removeItem("jungfrau-wallet-user");
    }
  }, [currentUserId]);

  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const currentWallet =
    currentUser?.role === "guest"
      ? state.guestWallets.find((wallet) => wallet.userId === currentUser.id) ?? null
      : null;
  const currentCompany =
    currentUser?.role === "partner"
      ? companies.find((company) => company.id === currentUser.companyId) ?? null
      : null;
  const currentCompanyAccount =
    currentCompany !== null
      ? state.companyAccounts.find((account) => account.companyId === currentCompany.id) ?? null
      : null;

  const currentGuestPayments =
    currentUser?.role === "guest"
      ? state.payments.filter((payment) => payment.guestUserId === currentUser.id)
      : [];
  const currentGuestActivities =
    currentUser?.role === "guest"
      ? state.activities.filter((activity) => activity.userId === currentUser.id)
      : [];
  const currentGuestPointsEntries =
    currentUser?.role === "guest"
      ? state.pointsEntries.filter((entry) => entry.userId === currentUser.id)
      : [];
  const currentGuestHotelBookings =
    currentUser?.role === "guest"
      ? state.hotelBookings.filter((booking) => booking.userId === currentUser.id)
      : [];
  const currentGuestSustainabilityClaims =
    currentUser?.role === "guest"
      ? state.sustainabilityClaims.filter((claim) => claim.userId === currentUser.id)
      : [];

  const currentCompanyPayments =
    currentCompany !== null
      ? state.payments.filter((payment) => payment.companyId === currentCompany.id)
      : [];
  const currentCompanyBatches =
    currentCompany !== null
      ? state.batches.filter((batch) =>
          batch.payouts.some((payout) => payout.companyId === currentCompany.id)
        )
      : [];
  const currentCompanyStoreRequests =
    currentCompany !== null
      ? state.storeRequests.filter((request) => request.companyId === currentCompany.id)
      : [];
  const currentCompanyExperiences =
    currentCompany !== null
      ? state.experiences.filter((experience) => experience.companyId === currentCompany.id)
      : [];

  const availablePointsBalance =
    currentUser?.role === "guest" ? availablePointsForUser(state.pointsEntries, currentUser.id) : 0;
  const availablePointsValueCents = pointsValueCents(availablePointsBalance);
  const normalizedExperienceSearch = deferredExperienceSearch.trim().toLowerCase();

  const unsettledPayments = state.payments.filter(
    (payment) => payment.status === "awaiting_settlement" || payment.status === "batched"
  );
  const awaitingPayments = state.payments.filter((payment) => payment.status === "awaiting_settlement");
  const openBatch = state.batches.find((batch) => batch.status === "open");
  const livePayablesCents = unsettledPayments.reduce((sum, payment) => sum + payment.amountCents, 0);

  const partnerExposure = companies
    .map((company) => ({
      company,
      amountCents: unsettledPayments
        .filter((payment) => payment.companyId === company.id)
        .reduce((sum, payment) => sum + payment.amountCents, 0),
      count: unsettledPayments.filter((payment) => payment.companyId === company.id).length
    }))
    .filter((item) => item.amountCents > 0);

  const currentCompanyReceivableCents = currentCompanyPayments
    .filter((payment) => payment.status === "awaiting_settlement" || payment.status === "batched")
    .reduce((sum, payment) => sum + payment.amountCents, 0);

  const currentCompanyAvailableFundsCents = currentCompanyAccount?.availableBalanceCents ?? 0;
  const currentGuestPendingCents = currentGuestPayments
    .filter((payment) => payment.status === "awaiting_settlement" || payment.status === "batched")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const currentGuestSettledCents = currentGuestPayments
    .filter((payment) => payment.status === "settled")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const currentGuestTopUpCount = currentGuestActivities.filter((activity) => activity.amountCents > 0).length;
  const currentGuestLatestActivity = currentGuestActivities[0] ?? null;
  const currentGuestTotalEarnedPoints = currentGuestPointsEntries
    .filter((entry) => entry.kind === "earn")
    .reduce((sum, entry) => sum + entry.points, 0);
  const currentGuestTotalRedeemedPoints = currentGuestPointsEntries
    .filter((entry) => entry.kind === "spend")
    .reduce((sum, entry) => sum + entry.points, 0);
  const currentGuestCashbackPoints = currentGuestPointsEntries
    .filter((entry) => entry.source === "payment_cashback")
    .reduce((sum, entry) => sum + entry.points, 0);
  const currentGuestHotelPoints = currentGuestPointsEntries
    .filter((entry) => entry.source === "hotel_booking")
    .reduce((sum, entry) => sum + entry.points, 0);
  const currentGuestSustainabilityPoints = currentGuestPointsEntries
    .filter((entry) => entry.source === "sustainability_bonus")
    .reduce((sum, entry) => sum + entry.points, 0);
  const currentGuestLatestPointsEntry = [...currentGuestPointsEntries].reverse()[0] ?? null;
  const availableSustainabilityRewards =
    currentUser?.role === "guest"
      ? sustainabilityRewards.filter(
          (reward) => !currentGuestSustainabilityClaims.some((claim) => claim.rewardId === reward.id)
        )
      : [];
  const currentCompanyAwaitingCents = currentCompanyPayments
    .filter((payment) => payment.status === "awaiting_settlement")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const currentCompanyBatchedCents = currentCompanyPayments
    .filter((payment) => payment.status === "batched")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const currentCompanyPaidBatchCount = currentCompanyBatches.filter((batch) => batch.status === "paid").length;
  const currentCompanyLatestBatch = currentCompanyBatches[0] ?? null;
  const currentCompanyActiveStoreRequest = currentCompanyStoreRequests.find(
    (request) => request.status === "active"
  ) ?? null;
  const currentCompanyOpenStoreRequestCount = currentCompanyStoreRequests.filter(
    (request) => request.status === "active"
  ).length;
  const totalCompanyAvailableFundsCents = state.companyAccounts.reduce(
    (sum, account) => sum + account.availableBalanceCents,
    0
  );
  const totalSettledBatchVolumeCents = state.batches
    .filter((batch) => batch.status === "paid")
    .reduce((sum, batch) => sum + batch.totalCents, 0);
  const opsPaidBatchCount = state.batches.filter((batch) => batch.status === "paid").length;
  const opsOpenBatchCompanyCount = openBatch?.payouts.length ?? 0;
  const largestPartnerExposure = partnerExposure[0] ?? null;
  const activeStoreRequests = state.storeRequests.filter((request) => request.status === "active");
  const scannedStoreRequest =
    currentUser?.role === "guest"
      ? state.storeRequests.find(
          (request) => request.code.toLowerCase() === scanCode.trim().toLowerCase()
        ) ?? null
      : null;
  const filteredExperiences = state.experiences
    .filter((experience) => {
      const matchesFilter =
        activeExperienceFilter === "All"
          ? true
          : activeExperienceFilter === "Deals"
            ? experience.isDeal
            : experience.category === activeExperienceFilter;
      const matchesSearch =
        normalizedExperienceSearch.length === 0
          ? true
          : [
              experience.title,
              experience.companyName,
              experience.village,
              experience.category,
              experience.summary,
              experience.offer
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedExperienceSearch);

      return matchesFilter && matchesSearch;
    })
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }

      if (left.isDeal !== right.isDeal) {
        return left.isDeal ? -1 : 1;
      }

      return left.priceCents - right.priceCents;
    });
  const featuredExperience = filteredExperiences.find((experience) => experience.featured) ?? filteredExperiences[0] ?? null;
  const discoverExperiences = filteredExperiences.filter(
    (experience) => experience.id !== featuredExperience?.id
  );

  function categoryCount(filter: ExperienceFilter) {
    if (filter === "All") {
      return state.experiences.length;
    }

    if (filter === "Deals") {
      return state.experiences.filter((experience) => experience.isDeal).length;
    }

    return state.experiences.filter((experience) => experience.category === filter).length;
  }

  function paymentBreakdown(amountCents: number) {
    const pointsUsed =
      currentUser?.role === "guest" && currentWallet && usePointsOnNextPayment
        ? Math.min(availablePointsBalance, amountCents)
        : 0;

    return {
      pointsUsed,
      cashPaidCents: amountCents - pointsValueCents(pointsUsed)
    };
  }

  function checkoutPaymentBreakdown(experience: Experience, method: "no-points" | "some-points" | "max-coins") {
    const totalPrice = experience.priceCents;
    
    if (method === "no-points") {
      return {
        pointsUsed: 0,
        coinsPaidCents: 0,
        cashPaidCents: totalPrice
      };
    }
    
    if (method === "some-points") {
      const pointsToUse = Math.min(checkoutPointsAmount, availablePointsBalance);
      const pointsValue = pointsValueCents(pointsToUse);
      const cashNeeded = totalPrice - pointsValue;
      return {
        pointsUsed: pointsToUse,
        coinsPaidCents: 0,
        cashPaidCents: Math.max(0, cashNeeded)
      };
    }
    
    // max-coins
    const maxCoinsToPay = Math.min(experience.maxCoinsPaidCents, totalPrice);
    const remaining = totalPrice - maxCoinsToPay;
    return {
      pointsUsed: 0,
      coinsPaidCents: maxCoinsToPay,
      cashPaidCents: remaining
    };
  }

  function paymentPreview(experience: Experience) {
    return paymentBreakdown(experience.priceCents);
  }

  function addNotice(nextNotice: Notice) {
    setNotice(nextNotice);
  }

  function signInAs(user: User) {
    setCurrentUserId(user.id);
    setActiveTab(defaultTabForRole(user.role));
    setExperienceSearch("");
    setActiveExperienceFilter("All");
    setShowScanPanel(false);
    setShowQrGenerator(false);
    setScanCode("");
    resetExperienceDraft();
    addNotice({
      tone: "success",
      text:
        user.role === "guest"
            ? `${user.name} signed in.`
          : user.role === "partner"
            ? `${user.name} signed in for company view.`
            : `${user.name} signed in for settlement ops.`
    });
  }

  function resetExperienceDraft() {
    setNewExperienceTitle("");
    setNewExperienceCategory("Travel");
    setNewExperiencePrice("49");
    setNewExperienceDuration("Half day");
    setNewExperienceTag("New");
    setNewExperienceOffer("New drop");
    setNewExperienceSummary("");
    setNewExperienceMaxCoins("49");
    setNewExperienceSustainable(false);
    setNewExperienceFeatured(false);
  }

  function signOut() {
    setCurrentUserId(null);
    setExperienceSearch("");
    setActiveExperienceFilter("All");
    setShowScanPanel(false);
    setShowQrGenerator(false);
    setScanCode("");
    resetExperienceDraft();
    addNotice({
      tone: "default",
      text: "Signed out."
    });
  }

  function handleTopUp() {
    if (!currentUser || currentUser.role !== "guest" || !currentWallet) {
      return;
    }

    const amountCents = Math.round(Number(topUpAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      addNotice({
        tone: "warning",
        text: "Enter a valid top-up amount."
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      platformCashCents: previous.platformCashCents + amountCents,
      guestWallets: previous.guestWallets.map((wallet) =>
        wallet.userId === currentUser.id
          ? {
              ...wallet,
              availableBalanceCents: wallet.availableBalanceCents + amountCents
            }
          : wallet
      ),
      activities: [
        {
          id: makeId("activity"),
          userId: currentUser.id,
          title: "Wallet top-up",
          detail: topUpRail,
          amountCents,
          tone: "credit",
          timeLabel: "Now"
        },
        ...previous.activities
      ]
    }));
    addNotice({
      tone: "success",
      text: `Added ${formatCurrency(amountCents)} via ${topUpRail}.`
    });
  }

  function processGuestPayment(input: {
    title: string;
    companyId: string;
    companyName: string;
    village: string;
    amountCents: number;
    source: Payment["source"];
    cashbackRateBps?: number;
    activityTitle: string;
    activityDetail?: string;
    successText: string;
    requestId?: string;
    pointsUsed?: number;
    coinsPaidCents?: number;
  }) {
    if (!currentUser || currentUser.role !== "guest" || !currentWallet) {
      return false;
    }

    const pointsUsed = input.pointsUsed ?? (
      usePointsOnNextPayment
        ? Math.min(availablePointsBalance, input.amountCents)
        : 0
    );
    
    const coinsPaidCents = input.coinsPaidCents ?? 0;
    const cashPaidCents = input.amountCents - pointsValueCents(pointsUsed) - coinsPaidCents;

    if (currentWallet.availableBalanceCents < cashPaidCents) {
      addNotice({
        tone: "warning",
        text: "Wallet balance is too low."
      });
      return false;
    }

    const earnedPoints = cashbackPointsForPayment(cashPaidCents, input.cashbackRateBps ?? 200);

    setState((previous) => ({
      ...previous,
      guestWallets: previous.guestWallets.map((wallet) =>
        wallet.userId === currentUser.id
          ? {
              ...wallet,
              availableBalanceCents: wallet.availableBalanceCents - cashPaidCents,
              lifetimePaidCents: wallet.lifetimePaidCents + cashPaidCents
            }
          : wallet
      ),
      payments: [
        {
          id: makeId("payment"),
          guestUserId: currentUser.id,
          title: input.title,
          companyId: input.companyId,
          companyName: input.companyName,
          village: input.village,
          amountCents: input.amountCents,
          cashPaidCents,
          pointsUsed,
          source: input.source,
          status: "awaiting_settlement",
          timeLabel: "Now"
        },
        ...previous.payments
      ],
      pointsEntries: (() => {
        let nextPointsEntries = redeemPointsEntries(previous.pointsEntries, currentUser.id, pointsUsed);

        if (earnedPoints > 0) {
          nextPointsEntries = addPointsEntry(nextPointsEntries, {
            userId: currentUser.id,
            kind: "earn",
            source: "payment_cashback",
            label: input.title,
            detail: `${(input.cashbackRateBps ?? 200) / 100}% cashback in points`,
            points: earnedPoints,
            remainingPoints: earnedPoints,
            timeLabel: "Now"
          });
        }

        if (pointsUsed > 0) {
          nextPointsEntries = addPointsEntry(nextPointsEntries, {
            userId: currentUser.id,
            kind: "spend",
            source: "redeemed",
            label: input.title,
            detail: "Points redeemed",
            points: pointsUsed,
            timeLabel: "Now"
          });
        }

        return nextPointsEntries;
      })(),
      storeRequests: previous.storeRequests.map((request) =>
        request.id === input.requestId
          ? {
              ...request,
              status: "paid",
              paidAt: "Now",
              paidByUserId: currentUser.id
            }
          : request
      ),
      activities: [
        {
          id: makeId("activity"),
          userId: currentUser.id,
          title: input.activityTitle,
          detail:
            input.activityDetail ??
            (pointsUsed > 0
              ? `Paid ${formatCurrency(cashPaidCents)} + ${pointsUsed} pt`
              : earnedPoints > 0
                ? `Paid • +${earnedPoints} pts`
                : "Paid"),
          amountCents: -input.amountCents,
          tone: "debit",
          timeLabel: "Now"
        },
        ...previous.activities
      ]
    }));

    addNotice({
      tone: "success",
      text:
        pointsUsed > 0
          ? `Paid ${input.successText} with ${pointsUsed} point${pointsUsed > 1 ? "s" : ""} and ${formatCurrency(cashPaidCents)} cash.`
          : coinsPaidCents > 0
            ? `Paid ${input.successText} with ${formatCurrency(coinsPaidCents)} coins and ${formatCurrency(cashPaidCents)} cash.`
            : earnedPoints > 0
              ? `Paid ${input.successText}. +${earnedPoints} cashback points.`
              : `Paid ${input.successText} from wallet balance.`
    });
    setActiveTab("more");
    setShowScanPanel(false);
    setScanCode("");
    setSelectedExperienceForCheckout(null);
    setCheckoutPaymentMethod(null);
    return true;
  }

  function handleDirectPayment(experience: Experience) {
    processGuestPayment({
      title: experience.title,
      companyId: experience.companyId,
      companyName: experience.companyName,
      village: experience.village,
      amountCents: experience.priceCents,
      source: "experience",
      cashbackRateBps: experience.sustainable ? 500 : 200,
      activityTitle: experience.companyName,
      successText: experience.title
    });
  }

  function handleExperienceCheckout(experience: Experience) {
    setSelectedExperienceForCheckout(experience);
    setCheckoutPaymentMethod(null);
    setCheckoutPointsAmount(0);
  }

  function handleCheckoutConfirm(experience: Experience, method: "no-points" | "some-points" | "max-coins") {
    if (!currentUser || currentUser.role !== "guest") {
      return;
    }

    const breakdown = checkoutPaymentBreakdown(experience, method);
    
    processGuestPayment({
      title: experience.title,
      companyId: experience.companyId,
      companyName: experience.companyName,
      village: experience.village,
      amountCents: experience.priceCents,
      source: "experience",
      cashbackRateBps: experience.sustainable ? 500 : 200,
      activityTitle: experience.companyName,
      successText: experience.title,
      pointsUsed: breakdown.pointsUsed,
      coinsPaidCents: breakdown.coinsPaidCents
    });
  }

  function handleCreateStoreRequest() {
    if (!currentUser || currentUser.role !== "partner" || !currentCompany) {
      return;
    }

    const amountCents = Math.round(Number(storeRequestAmount) * 100);
    const title = storeRequestTitle.trim();
    if (!Number.isFinite(amountCents) || amountCents <= 0 || title.length === 0) {
      addNotice({
        tone: "warning",
        text: "Enter a title and valid amount."
      });
      return;
    }

    const request: StorePaymentRequest = {
      id: makeId("request"),
      code: makeRequestCode(currentCompany.name),
      companyId: currentCompany.id,
      companyName: currentCompany.name,
      village: currentCompany.village,
      title,
      amountCents,
      status: "active",
      createdAt: "Now"
    };

    setState((previous) => ({
      ...previous,
      storeRequests: [request, ...previous.storeRequests]
    }));
    setShowQrGenerator(true);
    addNotice({
      tone: "success",
      text: `${request.code} ready to scan.`
    });
  }

  function handlePayStoreRequest(request: StorePaymentRequest) {
    if (request.status !== "active") {
      addNotice({
        tone: "warning",
        text: "That QR request is no longer open."
      });
      return;
    }

    processGuestPayment({
      title: request.title,
      companyId: request.companyId,
      companyName: request.companyName,
      village: request.village,
      amountCents: request.amountCents,
      source: "store_request",
      cashbackRateBps: 200,
      activityTitle: request.companyName,
      activityDetail: `Store QR • ${request.title}`,
      successText: `${request.title} at ${request.companyName}`,
      requestId: request.id
    });
  }

  function handleBookHotel(offer: HotelOffer) {
    if (!currentUser || currentUser.role !== "guest") {
      return;
    }

    const existingBooking = state.hotelBookings.find(
      (booking) => booking.userId === currentUser.id && booking.hotelId === offer.id
    );
    if (existingBooking) {
      addNotice({
        tone: "warning",
        text: "This hotel reward was already booked."
      });
      return;
    }

    const pointsAwarded = hotelRewardPoints(offer.amountCents);
    setState((previous) => ({
      ...previous,
      hotelBookings: [
        {
          id: makeId("booking"),
          userId: currentUser.id,
          hotelId: offer.id,
          hotelName: offer.name,
          village: offer.village,
          amountCents: offer.amountCents,
          nights: offer.nights,
          pointsAwarded,
          timeLabel: "Now"
        },
        ...previous.hotelBookings
      ],
      pointsEntries: addPointsEntry(previous.pointsEntries, {
        userId: currentUser.id,
        kind: "earn",
        source: "hotel_booking",
        label: offer.name,
        detail: "10% hotel booking reward",
        points: pointsAwarded,
        remainingPoints: pointsAwarded,
        timeLabel: "Now"
      }),
      activities: [
        {
          id: makeId("activity"),
          userId: currentUser.id,
          title: offer.name,
          detail: `Booked • +${pointsAwarded} pts`,
          amountCents: 0,
          tone: "neutral",
          timeLabel: "Now"
        },
        ...previous.activities
      ]
    }));
    addNotice({
      tone: "success",
      text: `${offer.name} booked. +${pointsAwarded} points.`
    });
  }

  function handleClaimSustainabilityReward(reward: SustainabilityReward) {
    if (!currentUser || currentUser.role !== "guest") {
      return;
    }

    if (state.sustainabilityClaims.some((claim) => claim.userId === currentUser.id && claim.rewardId === reward.id)) {
      addNotice({
        tone: "warning",
        text: "This sustainability reward was already claimed."
      });
      return;
    }

    const pointsAwarded = sustainabilityActionPoints(reward.referenceAmountCents);
    setState((previous) => ({
      ...previous,
      sustainabilityClaims: [
        {
          id: makeId("claim"),
          userId: currentUser.id,
          rewardId: reward.id,
          timeLabel: "Now"
        },
        ...previous.sustainabilityClaims
      ],
      pointsEntries: addPointsEntry(previous.pointsEntries, {
        userId: currentUser.id,
        kind: "earn",
        source: "sustainability_bonus",
        label: reward.title,
        detail: "5% sustainable action reward",
        points: pointsAwarded,
        remainingPoints: pointsAwarded,
        timeLabel: "Now"
      }),
      activities: [
        {
          id: makeId("activity"),
          userId: currentUser.id,
          title: reward.title,
          detail: `Sustainable choice • +${pointsAwarded} pts`,
          amountCents: 0,
          tone: "neutral",
          timeLabel: "Now"
        },
        ...previous.activities
      ]
    }));
    addNotice({
      tone: "success",
      text: `${reward.title} claimed. +${pointsAwarded} points.`
    });
  }

  function handleCreateExperience() {
    if (!currentUser || currentUser.role !== "partner" || !currentCompany) {
      return;
    }

    const title = newExperienceTitle.trim();
    const summary = newExperienceSummary.trim();
    const tag = newExperienceTag.trim() || "New";
    const offer = newExperienceOffer.trim() || "New drop";
    const duration = newExperienceDuration.trim() || "Flexible";
    const priceCents = Math.round(Number(newExperiencePrice) * 100);
    const requestedMaxCoinsCents = Math.round(Number(newExperienceMaxCoins) * 100);

    if (title.length < 3 || summary.length < 8 || !Number.isFinite(priceCents) || priceCents <= 0) {
      addNotice({
        tone: "warning",
        text: "Enter a title, summary, and valid price."
      });
      return;
    }

    const maxCoinsPaidCents = Math.max(0, Math.min(priceCents, Number.isFinite(requestedMaxCoinsCents) ? requestedMaxCoinsCents : priceCents));
    const nextExperience: Experience = {
      id: makeId("exp"),
      title,
      village: currentCompany.village,
      companyId: currentCompany.id,
      companyName: currentCompany.name,
      category: newExperienceCategory,
      priceCents,
      duration,
      tag,
      summary,
      offer,
      sustainable: newExperienceSustainable,
      isDeal: true,
      featured: newExperienceFeatured,
      maxCoinsPaidCents
    };

    setState((previous) => ({
      ...previous,
      experiences: [
        nextExperience,
        ...previous.experiences.map((experience) =>
          newExperienceFeatured && experience.companyId === currentCompany.id
            ? { ...experience, featured: false }
            : experience
        )
      ]
    }));
    resetExperienceDraft();
    addNotice({
      tone: "success",
      text: `${nextExperience.title} added to the marketplace.`
    });
  }

  function handleCreateBatch() {
    if (awaitingPayments.length === 0) {
      addNotice({
        tone: "warning",
        text: "No partner payments are waiting for a batch."
      });
      return;
    }

    const payoutsMap = new Map<string, { companyName: string; amountCents: number; count: number }>();

    for (const payment of awaitingPayments) {
      const current = payoutsMap.get(payment.companyId);
      if (current) {
        current.amountCents += payment.amountCents;
        current.count += 1;
      } else {
        payoutsMap.set(payment.companyId, {
          companyName: payment.companyName,
          amountCents: payment.amountCents,
          count: 1
        });
      }
    }

    const batchId = makeId("batch");
    const batch: SettlementBatch = {
      id: batchId,
      reference: `SET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "open",
      totalCents: awaitingPayments.reduce((sum, payment) => sum + payment.amountCents, 0),
      createdAt: "Now",
      payouts: Array.from(payoutsMap.entries()).map(([companyId, summary]) => ({
        companyId,
        companyName: summary.companyName,
        amountCents: summary.amountCents,
        count: summary.count
      }))
    };

    setState((previous) => ({
      ...previous,
      payments: previous.payments.map((payment) =>
        payment.status === "awaiting_settlement"
          ? { ...payment, status: "batched", batchId }
          : payment
      ),
      batches: [batch, ...previous.batches]
    }));
    addNotice({
      tone: "success",
      text: `Created ${batch.reference}.`
    });
  }

  function handlePayBatch() {
    if (!openBatch) {
      addNotice({
        tone: "warning",
        text: "There is no open payout batch."
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      platformCashCents: previous.platformCashCents - openBatch.totalCents,
      companyAccounts: previous.companyAccounts.map((account) => {
        const payout = openBatch.payouts.find((entry) => entry.companyId === account.companyId);
        if (!payout) {
          return account;
        }

        return {
          ...account,
          availableBalanceCents: account.availableBalanceCents + payout.amountCents
        };
      }),
      payments: previous.payments.map((payment) =>
        payment.batchId === openBatch.id ? { ...payment, status: "settled" } : payment
      ),
      batches: previous.batches.map((batch) =>
        batch.id === openBatch.id
          ? { ...batch, status: "paid", settledAt: "Now" }
          : batch
      )
    }));
    addNotice({
      tone: "success",
      text: `${openBatch.reference} marked paid.`
    });
  }

  if (!currentUser) {
    return (
      <main className="canvas">
        <div className="ambient ambient-left" />
        <div className="ambient ambient-right" />
        <div className="phone-shell">
          <header className="topbar">
            <div className="brand-row">
              <span className="brand-mark">JW</span>
              <div>
                <h1>Jungfrau Wallet</h1>
              </div>
            </div>
            <div className="region-chip">Auth</div>
          </header>

          <section className={`notice notice-${notice.tone}`}>
            <span>{notice.text}</span>
          </section>

          <section className="surface-card">
            <div className="section-head">
              <div>
                <h2>Sign in</h2>
              </div>
            </div>
            <div className="account-stack">
              {users.map((user) => {
                const company = user.companyId
                  ? companies.find((entry) => entry.id === user.companyId)
                  : null;

                return (
                  <button
                    className="account-row"
                    key={user.id}
                    onClick={() => signInAs(user)}
                    type="button"
                  >
                    <div>
                      <strong>{user.name}</strong>
                      <p>
                        {roleLabel(user.role)}
                        {company ? ` • ${company.name}` : ""}
                      </p>
                    </div>
                    <span className="stat-pill">{roleLabel(user.role)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="canvas">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <div className="phone-shell">
        <header className="topbar">
          <div className="brand-row">
            <span className="brand-mark">JW</span>
            <div>
              <h1>{currentUser.role === "partner" && currentCompany ? currentCompany.name : "Jungfrau Wallet"}</h1>
              <div className="mini-meta">
                {currentUser.name} • {roleLabel(currentUser.role)}
              </div>
            </div>
          </div>
          <button className="region-chip" onClick={signOut} type="button">
            Switch
          </button>
        </header>

        <section className={`notice notice-${notice.tone}`}>
          <span>{notice.text}</span>
        </section>

        <div className="content-stack">
          {activeTab === "you" ? (
            <>
              <section className="hero-card ops-card">
                <div className="hero-row">
                  <div>
                    <p className="eyebrow">{roleLabel(currentUser.role)}</p>
                    <div className="hero-amount">
                      {currentUser.role === "guest"
                        ? currentUser.name.split(" ")[0]
                        : currentUser.role === "partner" && currentCompany
                          ? currentCompany.name.split(" ")[0]
                          : "Admin"}
                    </div>
                    <div className="hero-support">
                      {currentUser.role === "guest"
                        ? "Personal travel wallet"
                        : currentUser.role === "partner" && currentCompany
                          ? `${currentCompany.village} partner account`
                          : "Settlement command center"}
                    </div>
                  </div>
                  <div className="hero-pill">{roleLabel(currentUser.role)}</div>
                </div>
                <div className="hero-metrics">
                  {currentUser.role === "guest" && currentWallet ? (
                    <>
                      <div>
                        <span>Available</span>
                        <strong>{formatCurrency(currentWallet.availableBalanceCents)}</strong>
                      </div>
                      <div>
                        <span>Points</span>
                        <strong>{availablePointsBalance}</strong>
                      </div>
                      <div>
                        <span>Paid volume</span>
                        <strong>{formatCurrency(currentWallet.lifetimePaidCents)}</strong>
                      </div>
                      <div>
                        <span>Pending</span>
                        <strong>{formatCurrency(currentGuestPendingCents)}</strong>
                      </div>
                    </>
                  ) : null}
                  {currentUser.role === "partner" && currentCompany ? (
                    <>
                      <div>
                        <span>Company</span>
                        <strong>{currentCompany.village}</strong>
                      </div>
                      <div>
                        <span>Available</span>
                        <strong>{formatCurrency(currentCompanyAvailableFundsCents)}</strong>
                      </div>
                      <div>
                        <span>Pending</span>
                        <strong>{formatCurrency(currentCompanyReceivableCents)}</strong>
                      </div>
                      <div>
                        <span>Payments</span>
                        <strong>{currentCompanyPayments.length}</strong>
                      </div>
                    </>
                  ) : null}
                  {currentUser.role === "ops" ? (
                    <>
                      <div>
                        <span>Platform cash</span>
                        <strong>{formatCurrency(state.platformCashCents)}</strong>
                      </div>
                      <div>
                        <span>Partner payable</span>
                        <strong>{formatCurrency(livePayablesCents)}</strong>
                      </div>
                      <div>
                        <span>Available to partners</span>
                        <strong>{formatCurrency(totalCompanyAvailableFundsCents)}</strong>
                      </div>
                      <div>
                        <span>Paid batches</span>
                        <strong>{opsPaidBatchCount}</strong>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Account</h2>
                  </div>
                  <span className="stat-pill">{roleLabel(currentUser.role)}</span>
                </div>
                <div className="account-stack">
                  <div className="account-row account-row-static">
                    <div>
                      <strong>{currentUser.name}</strong>
                      <p>
                        {roleLabel(currentUser.role)}
                        {currentCompany ? ` • ${currentCompany.name}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="profile-grid">
                  {currentUser.role === "guest" && currentWallet ? (
                    <>
                      <div className="profile-metric">
                        <span>Settled spend</span>
                        <strong>{formatCurrency(currentGuestSettledCents)}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Top-ups</span>
                        <strong>{currentGuestTopUpCount}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Booked hotels</span>
                        <strong>{currentGuestHotelBookings.length}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Last activity</span>
                        <strong>{currentGuestLatestActivity?.timeLabel ?? "No activity"}</strong>
                      </div>
                    </>
                  ) : null}
                  {currentUser.role === "partner" && currentCompany ? (
                    <>
                      <div className="profile-metric">
                        <span>Awaiting</span>
                        <strong>{formatCurrency(currentCompanyAwaitingCents)}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Batched</span>
                        <strong>{formatCurrency(currentCompanyBatchedCents)}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Paid batches</span>
                        <strong>{currentCompanyPaidBatchCount}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Category</span>
                        <strong>{currentCompany.category}</strong>
                      </div>
                    </>
                  ) : null}
                  {currentUser.role === "ops" ? (
                    <>
                      <div className="profile-metric">
                        <span>Settled volume</span>
                        <strong>{formatCurrency(totalSettledBatchVolumeCents)}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Open batch</span>
                        <strong>{openBatch?.reference ?? "None"}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Partners in batch</span>
                        <strong>{opsOpenBatchCompanyCount}</strong>
                      </div>
                      <div className="profile-metric">
                        <span>Live exposure</span>
                        <strong>{partnerExposure.length}</strong>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="chip-row">
                  {currentUser.role === "guest" ? (
                    <button
                      className="ghost-chip"
                      onClick={() => setShowScanPanel((value) => !value)}
                      type="button"
                    >
                      {showScanPanel ? "Hide scanner" : "Scan store QR"}
                    </button>
                  ) : null}
                  {currentUser.role === "partner" ? (
                    <button
                      className="ghost-chip"
                      onClick={() => setShowQrGenerator((value) => !value)}
                      type="button"
                    >
                      {showQrGenerator ? "Hide QR" : "Generate payment QR"}
                    </button>
                  ) : null}
                  <button className="ghost-chip" onClick={signOut} type="button">
                    Switch account
                  </button>
                </div>
              </section>

              {currentUser.role === "guest" && showScanPanel ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Scan to pay</h2>
                    </div>
                    <span className="stat-pill">{activeStoreRequests.length} open</span>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span>QR code</span>
                      <input
                        placeholder="Paste or enter merchant code"
                        type="text"
                        value={scanCode}
                        onChange={(event) => setScanCode(event.target.value.toUpperCase())}
                      />
                    </label>
                  </div>
                  {scannedStoreRequest ? (
                    (() => {
                      const preview = paymentBreakdown(scannedStoreRequest.amountCents);
                      const qrCells = buildQrCells(scannedStoreRequest.code);

                      return (
                        <div className="qr-payment-panel">
                          <div className="qr-shell compact-qr-shell">
                            <div className="qr-grid">
                              {qrCells.map((cell, index) => (
                                <span
                                  className={`qr-cell ${cell ? "qr-cell-on" : ""}`}
                                  key={`${scannedStoreRequest.code}-${index}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="qr-payment-copy">
                            <strong>{scannedStoreRequest.title}</strong>
                            <p>
                              {scannedStoreRequest.companyName} • {scannedStoreRequest.village}
                            </p>
                            <div className="profile-grid compact-profile-grid">
                              <div className="profile-metric">
                                <span>Amount</span>
                                <strong>{formatCurrency(scannedStoreRequest.amountCents)}</strong>
                              </div>
                              <div className="profile-metric">
                                <span>Settlement path</span>
                                <strong>{storeRequestStatusLabel(scannedStoreRequest.status)}</strong>
                              </div>
                            </div>
                            <div className="mini-meta">
                              {preview.pointsUsed > 0
                                ? `${formatCurrency(preview.cashPaidCents)} cash + ${preview.pointsUsed} pt`
                                : "Pay fully from wallet balance"}
                            </div>
                            <button
                              className="primary-button"
                              onClick={() => handlePayStoreRequest(scannedStoreRequest)}
                              type="button"
                            >
                              {preview.pointsUsed > 0 ? "Send with points" : "Send money"}
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : scanCode.trim().length > 0 ? (
                    <div className="empty-card">QR code not found</div>
                  ) : null}
                  <div className="list-stack compact-list">
                    {activeStoreRequests.map((request) => (
                      <button
                        className="coupon-row"
                        key={request.id}
                        onClick={() => setScanCode(request.code)}
                        type="button"
                      >
                        <div>
                          <strong>{request.title}</strong>
                          <p>
                            {request.companyName} • {request.village}
                          </p>
                        </div>
                        <div className="list-side">
                          <span className="amount">{formatCurrency(request.amountCents)}</span>
                          <small>{request.code}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {currentUser.role === "partner" && currentCompany && (showQrGenerator || currentCompanyActiveStoreRequest) ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Store QR</h2>
                    </div>
                    <span className="stat-pill">{currentCompanyOpenStoreRequestCount} open</span>
                  </div>
                  <div className="form-grid compact-grid">
                    <label className="field">
                      <span>Label</span>
                      <input
                        type="text"
                        value={storeRequestTitle}
                        onChange={(event) => setStoreRequestTitle(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Amount</span>
                      <input
                        min="1"
                        step="1"
                        type="number"
                        value={storeRequestAmount}
                        onChange={(event) => setStoreRequestAmount(event.target.value)}
                      />
                    </label>
                  </div>
                  <button className="primary-button" onClick={handleCreateStoreRequest} type="button">
                    Generate QR request
                  </button>
                  {currentCompanyActiveStoreRequest ? (
                    (() => {
                      const qrCells = buildQrCells(currentCompanyActiveStoreRequest.code);

                      return (
                        <div className="qr-payment-panel">
                          <div className="qr-shell compact-qr-shell">
                            <div className="qr-grid">
                              {qrCells.map((cell, index) => (
                                <span
                                  className={`qr-cell ${cell ? "qr-cell-on" : ""}`}
                                  key={`${currentCompanyActiveStoreRequest.code}-${index}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="qr-payment-copy">
                            <strong>{currentCompanyActiveStoreRequest.title}</strong>
                            <p>{currentCompanyActiveStoreRequest.code}</p>
                            <div className="profile-grid compact-profile-grid">
                              <div className="profile-metric">
                                <span>Amount</span>
                                <strong>{formatCurrency(currentCompanyActiveStoreRequest.amountCents)}</strong>
                              </div>
                              <div className="profile-metric">
                                <span>Status</span>
                                <strong>{storeRequestStatusLabel(currentCompanyActiveStoreRequest.status)}</strong>
                              </div>
                            </div>
                            <div className="mini-meta">
                              Guests can scan or enter this code from their You page to pay instantly.
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="empty-card">Generate a payment QR to accept a wallet transfer.</div>
                  )}
                </section>
              ) : null}

              {currentUser.role === "guest" && currentWallet ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Overview</h2>
                    </div>
                    <span className="stat-pill">Guest</span>
                  </div>
                  <div className="profile-grid">
                    <div className="profile-metric profile-metric-strong">
                      <span>Ready to spend</span>
                      <strong>{formatCurrency(currentWallet.availableBalanceCents)}</strong>
                      <p>Current wallet balance available for direct payments.</p>
                    </div>
                    <div className="profile-metric profile-metric-strong">
                      <span>Rewards position</span>
                      <strong>{availablePointsBalance} pts</strong>
                      <p>Redeem value {formatCurrency(availablePointsValueCents)} at 100 pts = CHF 1.</p>
                    </div>
                  </div>
                  <div className="list-stack compact-list">
                    <div className="list-row">
                      <div>
                        <strong>Pending purchases</strong>
                        <p>Payments still waiting for partner settlement.</p>
                      </div>
                      <div className="list-side">
                        <span className="amount">{formatCurrency(currentGuestPendingCents)}</span>
                      </div>
                    </div>
                    <div className="list-row">
                      <div>
                        <strong>Latest movement</strong>
                        <p>{currentGuestLatestActivity?.title ?? "No activity yet"}</p>
                      </div>
                      <div className="list-side">
                        <small>{currentGuestLatestActivity?.detail ?? "Fresh account"}</small>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {currentUser.role === "guest" ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Hotel rewards</h2>
                    </div>
                    <span className="stat-pill">10% back</span>
                  </div>
                  <div className="discover-list">
                    {hotelOffers.map((offer, index) => {
                      const existingBooking = currentGuestHotelBookings.find(
                        (booking) => booking.hotelId === offer.id
                      );
                      const pointsAwarded = hotelRewardPoints(offer.amountCents);

                      return (
                        <button
                          className={`discover-card discover-card-${index % 4}`}
                          disabled={Boolean(existingBooking)}
                          key={offer.id}
                          onClick={() => handleBookHotel(offer)}
                          type="button"
                        >
                          <div className="discover-card-head">
                            <div className="chip-row featured-chip-row">
                              <span className="soft-chip soft-chip-dark">{offer.village}</span>
                              <span className="soft-chip soft-chip-dark">{offer.nights} nights</span>
                            </div>
                            <span className="market-price">{formatCurrency(offer.amountCents)}</span>
                          </div>
                          <div className="discover-card-copy">
                            <strong>{offer.name}</strong>
                            <p>{pointsAwarded} pts reward on confirmed booking.</p>
                          </div>
                          <div className="discover-card-footer">
                            <span className="mini-meta">
                              {existingBooking ? `Booked ${existingBooking.timeLabel}` : `${formatCurrency(pointsAwarded)} in points value`}
                            </span>
                            <span className="discover-link">{existingBooking ? "Booked" : "Book hotel"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {currentUser.role === "guest" ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Sustainable bonus</h2>
                    </div>
                    <span className="stat-pill">{availableSustainabilityRewards.length} open</span>
                  </div>
                  <div className="list-stack">
                    {sustainabilityRewards.map((reward) => {
                      const claimed = currentGuestSustainabilityClaims.some(
                        (claim) => claim.rewardId === reward.id
                      );

                      return (
                        <button
                          className={`coupon-row ${claimed ? "coupon-row-active" : ""}`}
                          disabled={claimed}
                          key={reward.id}
                          onClick={() => handleClaimSustainabilityReward(reward)}
                          type="button"
                        >
                          <div>
                            <strong>{reward.title}</strong>
                            <p>{reward.detail} • 5% reward</p>
                          </div>
                          <div className="list-side">
                            <span className="amount">+{sustainabilityActionPoints(reward.referenceAmountCents)} pts</span>
                            <small>{claimed ? "Claimed" : "Claim bonus"}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {currentUser.role === "guest" ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Points ledger</h2>
                    </div>
                    <span className="stat-pill">{currentGuestPointsEntries.length}</span>
                  </div>
                  <div className="profile-grid">
                    <div className="profile-metric">
                      <span>Total earned</span>
                      <strong>{currentGuestTotalEarnedPoints} pts</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Cashback earned</span>
                      <strong>{currentGuestCashbackPoints} pts</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Hotel rewards</span>
                      <strong>{currentGuestHotelPoints} pts</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Sustainable bonus</span>
                      <strong>{currentGuestSustainabilityPoints} pts</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Redeemed</span>
                      <strong>{currentGuestTotalRedeemedPoints} pts</strong>
                    </div>
                  </div>
                  <div className="mini-meta">
                    {currentGuestLatestPointsEntry
                      ? `Latest: ${currentGuestLatestPointsEntry.label} • ${currentGuestLatestPointsEntry.detail}`
                      : "No point activity yet"}
                  </div>
                  <div className="list-stack compact-list">
                    {[...currentGuestPointsEntries].reverse().slice(0, 4).map((entry) => (
                      <div className="list-row" key={entry.id}>
                        <div>
                          <strong>{entry.label}</strong>
                          <p>{entry.detail}</p>
                        </div>
                        <div className="list-side">
                          <span className={amountClass(entry.kind === "earn" ? "credit" : "debit")}>
                            {entry.kind === "earn" ? "+" : "-"}
                            {entry.points} pts
                          </span>
                          <small>{entry.timeLabel}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {currentUser.role === "partner" && currentCompany ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Performance</h2>
                    </div>
                    <span className="stat-pill">{currentCompany.village}</span>
                  </div>
                  <div className="profile-grid">
                    <div className="profile-metric profile-metric-strong">
                      <span>Receivables flow</span>
                      <strong>{formatCurrency(currentCompanyReceivableCents)}</strong>
                      <p>Combined awaiting and batched payments not yet released.</p>
                    </div>
                    <div className="profile-metric profile-metric-strong">
                      <span>Released funds</span>
                      <strong>{formatCurrency(currentCompanyAvailableFundsCents)}</strong>
                      <p>Funds available after paid settlement batches.</p>
                    </div>
                  </div>
                  <div className="list-stack compact-list">
                    <div className="list-row">
                      <div>
                        <strong>Latest batch</strong>
                        <p>{currentCompanyLatestBatch?.reference ?? "No batch yet"}</p>
                      </div>
                      <div className="list-side">
                        <small>
                          {currentCompanyLatestBatch
                            ? currentCompanyLatestBatch.status === "paid"
                              ? `Paid ${currentCompanyLatestBatch.settledAt}`
                              : `Opened ${currentCompanyLatestBatch.createdAt}`
                            : "Waiting for settlement"}
                        </small>
                      </div>
                    </div>
                    <div className="list-row">
                      <div>
                        <strong>Experience catalog</strong>
                        <p>Offers live for guests from this company.</p>
                      </div>
                      <div className="list-side">
                        <span className="amount">{currentCompanyExperiences.length}</span>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {currentUser.role === "ops" ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Network</h2>
                    </div>
                    <span className="stat-pill">Ops</span>
                  </div>
                  <div className="profile-grid">
                    <div className="profile-metric profile-metric-strong">
                      <span>Partner wallets</span>
                      <strong>{formatCurrency(totalCompanyAvailableFundsCents)}</strong>
                      <p>Total company-side balances already released by paid batches.</p>
                    </div>
                    <div className="profile-metric profile-metric-strong">
                      <span>Largest live exposure</span>
                      <strong>
                        {largestPartnerExposure
                          ? formatCurrency(largestPartnerExposure.amountCents)
                          : formatCurrency(0)}
                      </strong>
                      <p>{largestPartnerExposure?.company.name ?? "No unsettled partner exposure."}</p>
                    </div>
                  </div>
                  <div className="list-stack compact-list">
                    <div className="list-row">
                      <div>
                        <strong>Open payout batch</strong>
                        <p>{openBatch?.reference ?? "No open batch"}</p>
                      </div>
                      <div className="list-side">
                        <small>{openBatch ? `${openBatch.payouts.length} partners` : "Create when ready"}</small>
                      </div>
                    </div>
                    <div className="list-row">
                      <div>
                        <strong>Settled throughput</strong>
                        <p>Volume already released across paid batches.</p>
                      </div>
                      <div className="list-side">
                        <span className="amount">{formatCurrency(totalSettledBatchVolumeCents)}</span>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {currentUser.role === "guest" && activeTab === "wallet" && currentWallet ? (
            <>
              <section className="hero-card">
                <div className="hero-row">
                  <div>
                    <p className="eyebrow">Available balance</p>
                    <div className="hero-amount">{formatCurrency(currentWallet.availableBalanceCents)}</div>
                  </div>
                  <div className="hero-pill">Guest</div>
                </div>
                <div className="hero-metrics">
                  <div>
                    <span>Pending settlement</span>
                    <strong>
                      {formatCurrency(
                        currentGuestPayments
                          .filter(
                            (payment) =>
                              payment.status === "awaiting_settlement" || payment.status === "batched"
                          )
                          .reduce((sum, payment) => sum + payment.amountCents, 0)
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Spendable points</span>
                    <strong>{availablePointsBalance} pts</strong>
                  </div>
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Loyalty</h2>
                  </div>
                  <span className="stat-pill">2% / 5%</span>
                </div>
                <div className="reward-row">
                  <div>
                    <p className="reward-label">Spendable points</p>
                    <strong className="reward-value">{availablePointsBalance} pts</strong>
                  </div>
                  <div className="reward-side">
                    <span className="reward-badge">{formatCurrency(availablePointsValueCents)}</span>
                  </div>
                </div>
                <div className="profile-grid">
                  <div className="profile-metric">
                    <span>Cashback</span>
                    <strong>{currentGuestCashbackPoints} pts</strong>
                  </div>
                  <div className="profile-metric">
                    <span>Hotels</span>
                    <strong>{currentGuestHotelPoints} pts</strong>
                  </div>
                  <div className="profile-metric">
                    <span>Sustainable</span>
                    <strong>{currentGuestSustainabilityPoints} pts</strong>
                  </div>
                  <div className="profile-metric">
                    <span>Redeemed</span>
                    <strong>{currentGuestTotalRedeemedPoints} pts</strong>
                  </div>
                </div>
                <div className="mini-meta">
                  100 points = CHF 1. Standard in-app payments return 2%. Sustainable experiences and actions return 5%. Hotel bookings return 10%.
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Top up</h2>
                  </div>
                  <span className="stat-pill">{topUpRail}</span>
                </div>
                <div className="form-grid compact-grid">
                  <label className="field">
                    <span>Rail</span>
                    <select value={topUpRail} onChange={(event) => setTopUpRail(event.target.value)}>
                      <option>Open Banking</option>
                      <option>SEPA Instant</option>
                      <option>TWINT</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Amount</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={topUpAmount}
                      onChange={(event) => setTopUpAmount(event.target.value)}
                    />
                  </label>
                </div>
                <div className="chip-row">
                  {["20", "50", "100"].map((value) => (
                    <button className="ghost-chip" key={value} onClick={() => setTopUpAmount(value)} type="button">
                      CHF {value}
                    </button>
                  ))}
                </div>
                <button className="primary-button" onClick={handleTopUp} type="button">
                  Add funds
                </button>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Recent</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {currentGuestActivities.slice(0, 4).map((activity) => (
                    <div className="list-row" key={activity.id}>
                      <div>
                        <strong>{activity.title}</strong>
                        <p>{activity.detail}</p>
                      </div>
                      <div className="list-side">
                        <span className={amountClass(activity.tone)}>
                          {activity.amountCents > 0 ? "+" : activity.amountCents < 0 ? "-" : ""}
                          {formatCurrency(Math.abs(activity.amountCents))}
                        </span>
                        <small>{activity.timeLabel}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {currentUser.role === "partner" && activeTab === "wallet" && currentCompany ? (
            <>
              <section className="hero-card ops-card">
                <div className="hero-row">
                  <div>
                    <p className="eyebrow">Available funds</p>
                    <div className="hero-amount">{formatCurrency(currentCompanyAvailableFundsCents)}</div>
                  </div>
                  <div className="hero-pill">{currentCompany.category}</div>
                </div>
                <div className="hero-metrics">
                  <div>
                    <span>Pending</span>
                    <strong>{formatCurrency(currentCompanyReceivableCents)}</strong>
                  </div>
                  <div>
                    <span>Payments</span>
                    <strong>{currentCompanyPayments.length}</strong>
                  </div>
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Wallet view</h2>
                  </div>
                  <span className="stat-pill">{currentCompany.village}</span>
                </div>
                <div className="company-grid">
                  <div className="company-metric">
                    <span>Available</span>
                    <strong>{formatCurrency(currentCompanyAvailableFundsCents)}</strong>
                  </div>
                  <div className="company-metric">
                    <span>Awaiting</span>
                    <strong>
                      {formatCurrency(
                        currentCompanyPayments
                          .filter((payment) => payment.status === "awaiting_settlement")
                          .reduce((sum, payment) => sum + payment.amountCents, 0)
                      )}
                    </strong>
                  </div>
                  <div className="company-metric">
                    <span>Batched</span>
                    <strong>
                      {formatCurrency(
                        currentCompanyPayments
                          .filter((payment) => payment.status === "batched")
                          .reduce((sum, payment) => sum + payment.amountCents, 0)
                      )}
                    </strong>
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {currentUser.role === "ops" && activeTab === "wallet" ? (
            <>
              <section className="hero-card ops-card">
                <div className="hero-row">
                  <div>
                    <p className="eyebrow">Platform cash</p>
                    <div className="hero-amount">{formatCurrency(state.platformCashCents)}</div>
                  </div>
                  <div className="hero-pill">Ops</div>
                </div>
                <div className="hero-metrics">
                  <div>
                    <span>Open batch</span>
                    <strong>{openBatch ? openBatch.reference : "None"}</strong>
                  </div>
                  <div>
                    <span>Partner payable</span>
                    <strong>{formatCurrency(livePayablesCents)}</strong>
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {currentUser.role === "guest" && activeTab === "experiences" ? (
            <>
              <section className="surface-card marketplace-toolbar">
                <div className="section-head">
                  <div>
                    <h2>Discover</h2>
                  </div>
                  <span className="stat-pill">{filteredExperiences.length}</span>
                </div>
                <label className="search-shell">
                  <span className="search-icon">⌕</span>
                  <input
                    aria-label="Search experiences"
                    placeholder="Search deals, villages, companies"
                    type="search"
                    value={experienceSearch}
                    onChange={(event) => setExperienceSearch(event.target.value)}
                  />
                </label>
                <div className="filter-row" role="tablist" aria-label="Experience categories">
                  {experienceFilters.map((filter) => (
                    <button
                      aria-selected={activeExperienceFilter === filter}
                      className={`filter-chip ${activeExperienceFilter === filter ? "filter-chip-active" : ""}`}
                      key={filter}
                      onClick={() => setActiveExperienceFilter(filter)}
                      role="tab"
                      type="button"
                    >
                      <span>{filter}</span>
                      <small>{categoryCount(filter)}</small>
                    </button>
                  ))}
                </div>
                <div className="marketplace-meta">
                  <div className="mini-stat">
                    <span>Points</span>
                    <strong>{availablePointsBalance}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Rate</span>
                    <strong>2% / 5%</strong>
                  </div>
                  <button
                    className={`toggle-chip ${usePointsOnNextPayment ? "toggle-chip-active" : ""}`}
                    onClick={() => setUsePointsOnNextPayment((value) => !value)}
                    type="button"
                  >
                    {usePointsOnNextPayment ? "Using points" : "Cash only"}
                  </button>
                </div>
              </section>

              {featuredExperience ? (
                <section
                  className={`featured-market-card ${featuredExperience.sustainable ? "featured-market-card-sustainable" : ""}`}
                >
                  {(() => {
                    const preview = paymentPreview(featuredExperience);

                    return (
                      <>
                        <div className="featured-top">
                          <div className="chip-row featured-chip-row">
                            <span className="soft-chip">Main deal</span>
                            <span className="soft-chip soft-chip-dark">{featuredExperience.category}</span>
                            {featuredExperience.sustainable ? (
                              <span className="soft-chip soft-chip-green">Sustainable • 5%</span>
                            ) : null}
                            <span className="soft-chip soft-chip-dark">{featuredExperience.offer}</span>
                          </div>
                          <span className="market-price">{formatCurrency(featuredExperience.priceCents)}</span>
                        </div>
                        <div className="featured-copy">
                          <h2>{featuredExperience.title}</h2>
                          <p>{featuredExperience.summary}</p>
                        </div>
                        <div className="featured-grid">
                          <div>
                            <span>Company</span>
                            <strong>{featuredExperience.companyName}</strong>
                          </div>
                          <div>
                            <span>Village</span>
                            <strong>{featuredExperience.village}</strong>
                          </div>
                          <div>
                            <span>Access</span>
                            <strong>{featuredExperience.duration}</strong>
                          </div>
                        </div>
                        <div className="featured-footer">
                          <div>
                            <div className="featured-cta-line">{featuredExperience.tag}</div>
                            <div className="mini-meta">
                              {preview.pointsUsed > 0
                                ? `${formatCurrency(preview.cashPaidCents)} cash + ${preview.pointsUsed} pt`
                                : featuredExperience.sustainable
                                  ? "Pay instantly with 5% points back"
                                  : "Pay instantly from wallet"}
                            </div>
                          </div>
                          <button
                            className="primary-button featured-button"
                            onClick={() => handleExperienceCheckout(featuredExperience)}
                            type="button"
                          >
                            {preview.pointsUsed > 0 ? "Pay with points" : "Pay now"}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </section>
              ) : (
                <section className="surface-card">
                  <div className="empty-card">No deals match this search</div>
                </section>
              )}

              {selectedExperienceForCheckout ? (
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Payment options</h2>
                    </div>
                    <button
                      className="ghost-chip"
                      onClick={() => {
                        setSelectedExperienceForCheckout(null);
                        setCheckoutPaymentMethod(null);
                      }}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                  <div className="list-row">
                    <div>
                      <strong>{selectedExperienceForCheckout.title}</strong>
                      <p>{selectedExperienceForCheckout.companyName} • {selectedExperienceForCheckout.village}</p>
                    </div>
                    <div className="list-side">
                      <span className="amount">{formatCurrency(selectedExperienceForCheckout.priceCents)}</span>
                    </div>
                  </div>
                  <div className="profile-grid">
                    <div className="profile-metric">
                      <span>Wallet balance</span>
                      <strong>{currentWallet ? formatCurrency(currentWallet.availableBalanceCents) : "N/A"}</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Available points</span>
                      <strong>{availablePointsBalance} pts</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Max coin payment</span>
                      <strong>{formatCurrency(selectedExperienceForCheckout.maxCoinsPaidCents)}</strong>
                    </div>
                  </div>

                  <div className="chip-row">
                    <button
                      className={`ghost-chip ${checkoutPaymentMethod === "no-points" ? "ghost-chip-active" : ""}`}
                      onClick={() => {
                        setCheckoutPaymentMethod("no-points");
                      }}
                      type="button"
                    >
                      No points
                    </button>
                    <button
                      className={`ghost-chip ${checkoutPaymentMethod === "some-points" ? "ghost-chip-active" : ""}`}
                      onClick={() => {
                        setCheckoutPaymentMethod("some-points");
                      }}
                      type="button"
                    >
                      Some points
                    </button>
                    <button
                      className={`ghost-chip ${checkoutPaymentMethod === "max-coins" ? "ghost-chip-active" : ""}`}
                      onClick={() => {
                        setCheckoutPaymentMethod("max-coins");
                      }}
                      type="button"
                    >
                      Max coins
                    </button>
                  </div>

                  {checkoutPaymentMethod === "no-points" ? (
                    (() => {
                      const breakdown = checkoutPaymentBreakdown(selectedExperienceForCheckout, "no-points");
                      return (
                        <div className="profile-grid">
                          <div className="profile-metric">
                            <span>Payment method</span>
                            <strong>Wallet only</strong>
                          </div>
                          <div className="profile-metric">
                            <span>Coins</span>
                            <strong>{formatCurrency(0)}</strong>
                          </div>
                          <div className="profile-metric">
                            <span>Cash from wallet</span>
                            <strong>{formatCurrency(breakdown.cashPaidCents)}</strong>
                          </div>
                          <div className="profile-metric">
                            <span>Points used</span>
                            <strong>0 pts</strong>
                          </div>
                        </div>
                      );
                    })()
                  ) : checkoutPaymentMethod === "some-points" ? (
                    (() => {
                      const breakdown = checkoutPaymentBreakdown(selectedExperienceForCheckout, "some-points");
                      const maxPoints = Math.min(availablePointsBalance, selectedExperienceForCheckout.priceCents);
                      return (
                        <div>
                          <div className="form-grid compact-grid">
                            <label className="field">
                              <span>Points to use (max {maxPoints})</span>
                              <input
                                min="0"
                                max={maxPoints}
                                type="number"
                                value={checkoutPointsAmount}
                                onChange={(event) => setCheckoutPointsAmount(Math.max(0, Math.min(maxPoints, Number(event.target.value))))}
                              />
                            </label>
                          </div>
                          <div className="profile-grid">
                            <div className="profile-metric">
                              <span>Coins</span>
                              <strong>{formatCurrency(0)}</strong>
                            </div>
                            <div className="profile-metric">
                              <span>Cash from wallet</span>
                              <strong>{formatCurrency(breakdown.cashPaidCents)}</strong>
                            </div>
                            <div className="profile-metric">
                              <span>Points used</span>
                              <strong>{checkoutPointsAmount} pts</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : checkoutPaymentMethod === "max-coins" ? (
                    (() => {
                      const breakdown = checkoutPaymentBreakdown(selectedExperienceForCheckout, "max-coins");
                      return (
                        <div className="profile-grid">
                          <div className="profile-metric">
                            <span>Coins to pay</span>
                            <strong>{formatCurrency(breakdown.coinsPaidCents)}</strong>
                          </div>
                          <div className="profile-metric">
                            <span>Cash from wallet</span>
                            <strong>{formatCurrency(breakdown.cashPaidCents)}</strong>
                          </div>
                          <div className="profile-metric">
                            <span>Points used</span>
                            <strong>0 pts</strong>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}

                  {checkoutPaymentMethod ? (
                    <button
                      className="primary-button"
                      onClick={() => {
                        if (checkoutPaymentMethod) {
                          handleCheckoutConfirm(selectedExperienceForCheckout, checkoutPaymentMethod);
                        }
                      }}
                      type="button"
                    >
                      Confirm payment
                    </button>
                  ) : null}
                </section>
              ) : null}

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Discover more</h2>
                  </div>
                  <span className="stat-pill">{discoverExperiences.length}</span>
                </div>
                <div className="discover-list">
                  {discoverExperiences.length === 0 ? (
                    <div className="empty-card">Try another category or search</div>
                  ) : (
                    discoverExperiences.map((experience, index) => {
                      const preview = paymentPreview(experience);

                      return (
                        <button
                          className={`discover-card discover-card-${index % 4} ${experience.sustainable ? "discover-card-sustainable" : ""}`}
                          key={experience.id}
                          onClick={() => handleExperienceCheckout(experience)}
                          type="button"
                        >
                          <div className="discover-card-head">
                            <div className="chip-row featured-chip-row">
                              <span className="soft-chip soft-chip-dark">{experience.category}</span>
                              {experience.sustainable ? (
                                <span className="soft-chip soft-chip-green">5% sustainable</span>
                              ) : null}
                              <span className="soft-chip soft-chip-dark">{experience.offer}</span>
                            </div>
                            <span className="market-price">{formatCurrency(experience.priceCents)}</span>
                          </div>
                          <div className="discover-card-copy">
                            <strong>{experience.title}</strong>
                            <p>{experience.summary}</p>
                          </div>
                          <div className="discover-card-meta">
                            <span>{experience.companyName}</span>
                            <span>{experience.village}</span>
                            <span>{experience.duration}</span>
                          </div>
                          <div className="discover-card-footer">
                            <span className="mini-meta">
                              {preview.pointsUsed > 0
                                ? `${formatCurrency(preview.cashPaidCents)} + ${preview.pointsUsed} pt`
                                : experience.sustainable
                                  ? "Wallet pay • 5% back"
                                  : "Wallet pay"}
                            </span>
                            <span className="discover-link">
                              {preview.pointsUsed > 0 ? "Pay with points" : "Pay now"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          ) : null}

          {currentUser.role === "partner" && activeTab === "experiences" && currentCompany ? (
            <>
                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Create experience</h2>
                    </div>
                    <span className="stat-pill">{currentCompany.name}</span>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span>Title</span>
                      <input
                        placeholder="Sunrise rail pass"
                        type="text"
                        value={newExperienceTitle}
                        onChange={(event) => setNewExperienceTitle(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Summary</span>
                      <input
                        placeholder="Short premium description for guests"
                        type="text"
                        value={newExperienceSummary}
                        onChange={(event) => setNewExperienceSummary(event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form-grid compact-grid">
                    <label className="field">
                      <span>Category</span>
                      <select
                        value={newExperienceCategory}
                        onChange={(event) => setNewExperienceCategory(event.target.value as ExperienceCategory)}
                      >
                        <option>Travel</option>
                        <option>Fashion</option>
                        <option>Sport</option>
                        <option>Food</option>
                        <option>Wellness</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Price</span>
                      <input
                        min="1"
                        step="1"
                        type="number"
                        value={newExperiencePrice}
                        onChange={(event) => setNewExperiencePrice(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Duration</span>
                      <input
                        type="text"
                        value={newExperienceDuration}
                        onChange={(event) => setNewExperienceDuration(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Max coins</span>
                      <input
                        min="0"
                        step="1"
                        type="number"
                        value={newExperienceMaxCoins}
                        onChange={(event) => setNewExperienceMaxCoins(event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="form-grid compact-grid">
                    <label className="field">
                      <span>Tag</span>
                      <input
                        type="text"
                        value={newExperienceTag}
                        onChange={(event) => setNewExperienceTag(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Offer line</span>
                      <input
                        type="text"
                        value={newExperienceOffer}
                        onChange={(event) => setNewExperienceOffer(event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="chip-row">
                    <button
                      className={`ghost-chip ${newExperienceSustainable ? "ghost-chip-active" : ""}`}
                      onClick={() => setNewExperienceSustainable((value) => !value)}
                      type="button"
                    >
                      {newExperienceSustainable ? "Sustainable" : "Mark sustainable"}
                    </button>
                    <button
                      className={`ghost-chip ${newExperienceFeatured ? "ghost-chip-active" : ""}`}
                      onClick={() => setNewExperienceFeatured((value) => !value)}
                      type="button"
                    >
                      {newExperienceFeatured ? "Featured" : "Make featured"}
                    </button>
                  </div>
                  <div className="experience-builder-preview">
                    <div className="experience-builder-top">
                      <div className="chip-row featured-chip-row">
                        <span className="soft-chip soft-chip-dark">{newExperienceCategory}</span>
                        {newExperienceSustainable ? <span className="soft-chip soft-chip-green">Sustainable</span> : null}
                        <span className="soft-chip soft-chip-dark">{newExperienceOffer || "New drop"}</span>
                      </div>
                      <span className="market-price">
                        {formatCurrency(Math.max(0, Math.round(Number(newExperiencePrice || 0) * 100)))}
                      </span>
                    </div>
                    <div className="discover-card-copy">
                      <strong>{newExperienceTitle || "New experience title"}</strong>
                      <p>{newExperienceSummary || "A polished marketplace summary will appear here."}</p>
                    </div>
                    <div className="discover-card-footer">
                      <span className="mini-meta">
                        {newExperienceDuration || "Flexible"} • Max coins{" "}
                        {formatCurrency(Math.max(0, Math.round(Number(newExperienceMaxCoins || 0) * 100)))}
                      </span>
                      <span className="discover-link">{newExperienceTag || "New"}</span>
                    </div>
                  </div>
                  <button className="primary-button" onClick={handleCreateExperience} type="button">
                    Publish experience
                  </button>
                  <div className="mini-meta">
                    New experiences publish directly into the guest marketplace, partner catalog, and ops view.
                  </div>
                </section>

                <section className="surface-card">
                  <div className="section-head">
                    <div>
                      <h2>Your catalog</h2>
                    </div>
                    <span className="stat-pill">{currentCompanyExperiences.length}</span>
                  </div>
                  <div className="list-stack">
                    {currentCompanyExperiences.map((experience) => (
                      <div className="list-row" key={experience.id}>
                        <div>
                          <strong>{experience.title}</strong>
                          <p>
                            {experience.category} • {experience.village} • {experience.duration}
                          </p>
                          <p className="mini-meta">
                            Max coin payment: {formatCurrency(experience.maxCoinsPaidCents)}
                            {experience.sustainable ? " • Sustainable" : ""}
                            {experience.featured ? " • Featured" : ""}
                          </p>
                        </div>
                        <div className="list-side">
                          <span className="amount">{formatCurrency(experience.priceCents)}</span>
                          <small>{experience.offer}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mini-meta">
                    Guests see the same pricing and payment options you configure here.
                  </div>
                </section>
            </>
          ) : null}

          {currentUser.role === "ops" && activeTab === "experiences" ? (
            <>
              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Catalog</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {state.experiences.map((experience) => (
                    <div className="list-row" key={experience.id}>
                      <div>
                        <strong>{experience.title}</strong>
                        <p>
                          {experience.category} • {experience.companyName} • {experience.village}
                        </p>
                      </div>
                      <div className="list-side">
                        <span className="amount">{formatCurrency(experience.priceCents)}</span>
                        <small>{experience.offer}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {currentUser.role === "guest" && activeTab === "more" ? (
            <>
              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Payments</h2>
                  </div>
                  <span className="stat-pill">{currentGuestPayments.length}</span>
                </div>
                <div className="list-stack">
                  {currentGuestPayments.map((payment) => (
                    <div className="list-row" key={payment.id}>
                      <div>
                        <strong>{payment.title}</strong>
                        <p>
                          {payment.companyName} • {payment.village}
                        </p>
                      </div>
                      <div className="list-side">
                        <span className="amount">{formatCurrency(payment.amountCents)}</span>
                        <small>
                          {payment.pointsUsed > 0
                            ? `${payment.source === "store_request" ? "Store QR" : "Experience"} • ${paymentStatusLabel(payment.status)} • ${formatCurrency(payment.cashPaidCents)} + ${payment.pointsUsed} pt`
                            : `${payment.source === "store_request" ? "Store QR" : "Experience"} • ${paymentStatusLabel(payment.status)}`}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Activity</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {currentGuestActivities.map((activity) => (
                    <div className="list-row" key={activity.id}>
                      <div>
                        <strong>{activity.title}</strong>
                        <p>{activity.detail}</p>
                      </div>
                      <div className="list-side">
                        <span className={amountClass(activity.tone)}>
                          {activity.amountCents > 0 ? "+" : activity.amountCents < 0 ? "-" : ""}
                          {formatCurrency(Math.abs(activity.amountCents))}
                        </span>
                        <small>{activity.timeLabel}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {currentUser.role === "partner" && activeTab === "more" && currentCompany ? (
            <>
              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Payments</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {currentCompanyPayments.map((payment) => {
                    const guest = users.find((user) => user.id === payment.guestUserId);

                    return (
                      <div className="list-row" key={payment.id}>
                        <div>
                          <strong>{payment.title}</strong>
                          <p>
                            {guest?.name ?? "Guest"} • {payment.timeLabel}
                          </p>
                        </div>
                        <div className="list-side">
                          <span className="amount">{formatCurrency(payment.amountCents)}</span>
                          <small>
                            {payment.source === "store_request" ? "Store QR" : "Experience"} • {paymentStatusLabel(payment.status)}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Batches</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {currentCompanyBatches.length === 0 ? (
                    <div className="empty-card">No batches yet</div>
                  ) : (
                    currentCompanyBatches.map((batch) => {
                      const payout = batch.payouts.find((entry) => entry.companyId === currentCompany.id);
                      return (
                        <div className="batch-card" key={batch.id}>
                          <div className="batch-head">
                            <div>
                              <strong>{batch.reference}</strong>
                              <p>{batch.status === "paid" ? `Paid ${batch.settledAt}` : `Opened ${batch.createdAt}`}</p>
                            </div>
                            <span className={`stat-pill ${batch.status === "paid" ? "stat-pill-dark" : ""}`}>
                              {batch.status === "paid" ? "Paid" : "Open"}
                            </span>
                          </div>
                          <div className="batch-total">{formatCurrency(payout?.amountCents ?? 0)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          ) : null}

          {currentUser.role === "ops" && activeTab === "more" ? (
            <>
              <section className="hero-card ops-card">
                <div className="hero-row">
                  <div>
                    <p className="eyebrow">Partner payable</p>
                    <div className="hero-amount">{formatCurrency(livePayablesCents)}</div>
                  </div>
                  <div className="hero-pill">Ops</div>
                </div>
                <div className="hero-metrics">
                  <div>
                    <span>Platform cash</span>
                    <strong>{formatCurrency(state.platformCashCents)}</strong>
                  </div>
                  <div>
                    <span>Open batch</span>
                    <strong>{openBatch ? openBatch.reference : "None"}</strong>
                  </div>
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Exposure</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {partnerExposure.length === 0 ? (
                    <div className="empty-card">Nothing to settle</div>
                  ) : (
                    partnerExposure.map((item) => (
                      <div className="list-row" key={item.company.id}>
                        <div>
                          <strong>{item.company.name}</strong>
                          <p>
                            {item.company.village} • {item.count} tx
                          </p>
                        </div>
                        <div className="list-side">
                          <span className="amount">{formatCurrency(item.amountCents)}</span>
                          <small>{item.company.category}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Payout</h2>
                  </div>
                </div>
                <div className="ops-actions">
                  <button className="primary-button" onClick={handleCreateBatch} type="button">
                    Create batch
                  </button>
                  <button className="secondary-button" onClick={handlePayBatch} type="button">
                    Mark paid
                  </button>
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Batches</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {state.batches.map((batch) => (
                    <div className="batch-card" key={batch.id}>
                      <div className="batch-head">
                        <div>
                          <strong>{batch.reference}</strong>
                          <p>{batch.status === "paid" ? `Paid ${batch.settledAt}` : `Opened ${batch.createdAt}`}</p>
                        </div>
                        <span className={`stat-pill ${batch.status === "paid" ? "stat-pill-dark" : ""}`}>
                          {batch.status === "paid" ? "Paid" : "Open"}
                        </span>
                      </div>
                      <div className="batch-total">{formatCurrency(batch.totalCents)}</div>
                      <div className="payout-stack">
                        {batch.payouts.map((payout) => (
                          <div className="payout-row" key={`${batch.id}-${payout.companyId}`}>
                            <span>{payout.companyName}</span>
                            <span>
                              {formatCurrency(payout.amountCents)} • {payout.count} tx
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>

        <nav className="tabbar">
          {tabs.map((tab) => (
            <button
              className={`tabbar-button ${activeTab === tab.id ? "tabbar-button-active" : ""}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span>{tab.icon}</span>
              <small>{tab.label}</small>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
