"use client";

import { useDeferredValue, useEffect, useState } from "react";

type Role = "guest" | "partner" | "ops";
type TabId = "you" | "wallet" | "experiences" | "more";
type BatchStatus = "open" | "paid";
type ActivityTone = "credit" | "debit" | "neutral";
type PaymentStatus = "awaiting_settlement" | "batched" | "settled";
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
  pointsBalance: number;
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
  isDeal: boolean;
  featured: boolean;
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
  status: PaymentStatus;
  timeLabel: string;
  batchId?: string;
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
  activities: Activity[];
  payments: Payment[];
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

const experiences: Experience[] = [
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
    isDeal: true,
    featured: true
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
    isDeal: true,
    featured: false
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
    isDeal: true,
    featured: false
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
    isDeal: false,
    featured: false
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
    isDeal: false,
    featured: false
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
    isDeal: false,
    featured: false
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
    status: "awaiting_settlement",
    timeLabel: "Now"
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
      lifetimePaidCents: 10400,
      pointsBalance: 1
    },
    {
      userId: "guest-jonas",
      availableBalanceCents: 11200,
      lifetimePaidCents: 2800,
      pointsBalance: 0
    }
  ],
  companyAccounts: buildCompanyAccounts(initialPayments),
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
      detail: "Paid",
      amountCents: -6200,
      tone: "debit",
      timeLabel: "Yesterday"
    },
    {
      id: "act-3",
      userId: "guest-maya",
      title: "Murren Alpine Rentals",
      detail: "Paid • +1 pt",
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
      detail: "Paid",
      amountCents: -2800,
      tone: "debit",
      timeLabel: "Yesterday"
    }
  ],
  payments: initialPayments,
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

function rewardPointsForSpend(spendCents: number) {
  return Math.floor(spendCents / 10000);
}

function progressToNextPointCents(spendCents: number) {
  return spendCents % 10000;
}

function pointsEarnedForPayment(currentSpendCents: number, paymentCents: number) {
  return rewardPointsForSpend(currentSpendCents + paymentCents) - rewardPointsForSpend(currentSpendCents);
}

function pointsValueCents(points: number) {
  return points * 100;
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

  const availablePointsBalance = currentWallet?.pointsBalance ?? 0;
  const pointsProgressCents = progressToNextPointCents(currentWallet?.lifetimePaidCents ?? 0);
  const nextPointRemainingCents = 10000 - pointsProgressCents;
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
  const currentCompanyAwaitingCents = currentCompanyPayments
    .filter((payment) => payment.status === "awaiting_settlement")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const currentCompanyBatchedCents = currentCompanyPayments
    .filter((payment) => payment.status === "batched")
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const currentCompanyPaidBatchCount = currentCompanyBatches.filter((batch) => batch.status === "paid").length;
  const currentCompanyLatestBatch = currentCompanyBatches[0] ?? null;
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
  const filteredExperiences = experiences
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
      return experiences.length;
    }

    if (filter === "Deals") {
      return experiences.filter((experience) => experience.isDeal).length;
    }

    return experiences.filter((experience) => experience.category === filter).length;
  }

  function paymentPreview(experience: Experience) {
    const pointsUsed =
      currentUser?.role === "guest" && currentWallet && usePointsOnNextPayment
        ? Math.min(currentWallet.pointsBalance, Math.floor(experience.priceCents / 100))
        : 0;

    return {
      pointsUsed,
      cashPaidCents: experience.priceCents - pointsValueCents(pointsUsed)
    };
  }

  function addNotice(nextNotice: Notice) {
    setNotice(nextNotice);
  }

  function signInAs(user: User) {
    setCurrentUserId(user.id);
    setActiveTab(defaultTabForRole(user.role));
    setExperienceSearch("");
    setActiveExperienceFilter("All");
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

  function signOut() {
    setCurrentUserId(null);
    setExperienceSearch("");
    setActiveExperienceFilter("All");
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

  function handleDirectPayment(experience: Experience) {
    if (!currentUser || currentUser.role !== "guest" || !currentWallet) {
      return;
    }

    const pointsUsed =
      usePointsOnNextPayment
        ? Math.min(currentWallet.pointsBalance, Math.floor(experience.priceCents / 100))
        : 0;
    const cashPaidCents = experience.priceCents - pointsValueCents(pointsUsed);

    if (currentWallet.availableBalanceCents < cashPaidCents) {
      addNotice({
        tone: "warning",
        text: "Wallet balance is too low."
      });
      return;
    }

    const earnedPoints = pointsEarnedForPayment(currentWallet.lifetimePaidCents, cashPaidCents);

    setState((previous) => ({
      ...previous,
      guestWallets: previous.guestWallets.map((wallet) =>
        wallet.userId === currentUser.id
          ? {
              ...wallet,
              availableBalanceCents: wallet.availableBalanceCents - cashPaidCents,
              lifetimePaidCents: wallet.lifetimePaidCents + cashPaidCents,
              pointsBalance: wallet.pointsBalance - pointsUsed + earnedPoints
            }
          : wallet
      ),
      payments: [
        {
          id: makeId("payment"),
          guestUserId: currentUser.id,
          title: experience.title,
          companyId: experience.companyId,
          companyName: experience.companyName,
          village: experience.village,
          amountCents: experience.priceCents,
          cashPaidCents,
          pointsUsed,
          status: "awaiting_settlement",
          timeLabel: "Now"
        },
        ...previous.payments
      ],
      activities: [
        {
          id: makeId("activity"),
          userId: currentUser.id,
          title: experience.companyName,
          detail:
            pointsUsed > 0
              ? `Paid ${formatCurrency(cashPaidCents)} + ${pointsUsed} pt`
              : earnedPoints > 0
                ? `Paid • +${earnedPoints} pt${earnedPoints > 1 ? "s" : ""}`
                : "Paid",
          amountCents: -experience.priceCents,
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
          ? `${experience.title} paid with ${pointsUsed} point${pointsUsed > 1 ? "s" : ""} and ${formatCurrency(cashPaidCents)} cash.`
          : earnedPoints > 0
            ? `${experience.title} paid. +${earnedPoints} payback point${earnedPoints > 1 ? "s" : ""}.`
            : `${experience.title} paid from wallet balance.`
    });
    setActiveTab("more");
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
                        <span>Next point</span>
                        <strong>
                          {nextPointRemainingCents === 10000
                            ? formatCurrency(10000)
                            : formatCurrency(nextPointRemainingCents)}
                        </strong>
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
                  <button className="ghost-chip" onClick={signOut} type="button">
                    Switch account
                  </button>
                </div>
              </section>

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
                      <p>Earn 1 point for each CHF 100 paid in cash.</p>
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
                        <span className="amount">
                          {experiences.filter((experience) => experience.companyId === currentCompany.id).length}
                        </span>
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
                    <span>Payback points</span>
                    <strong>{availablePointsBalance}</strong>
                  </div>
                </div>
              </section>

              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Payback</h2>
                  </div>
                  <span className="stat-pill">1 pt / CHF 100</span>
                </div>
                <div className="reward-row">
                  <div>
                    <p className="reward-label">Paid volume</p>
                    <strong className="reward-value">{formatCurrency(currentWallet.lifetimePaidCents)}</strong>
                  </div>
                  <div className="reward-side">
                    <span className="reward-badge">{availablePointsBalance} pts</span>
                  </div>
                </div>
                <div className="reward-progress">
                  <span
                    className="reward-progress-fill"
                    style={{ width: `${(pointsProgressCents / 10000) * 100}%` }}
                  />
                </div>
                <div className="mini-meta">
                  {nextPointRemainingCents === 10000
                    ? "Start spending to unlock points"
                    : `${formatCurrency(nextPointRemainingCents)} to next point`}
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
                    <strong>1 pt = CHF 1</strong>
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
                <section className="featured-market-card">
                  {(() => {
                    const preview = paymentPreview(featuredExperience);

                    return (
                      <>
                        <div className="featured-top">
                          <div className="chip-row featured-chip-row">
                            <span className="soft-chip">Main deal</span>
                            <span className="soft-chip soft-chip-dark">{featuredExperience.category}</span>
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
                                : "Pay instantly from wallet"}
                            </div>
                          </div>
                          <button
                            className="primary-button featured-button"
                            onClick={() => handleDirectPayment(featuredExperience)}
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
                          className={`discover-card discover-card-${index % 4}`}
                          key={experience.id}
                          onClick={() => handleDirectPayment(experience)}
                          type="button"
                        >
                          <div className="discover-card-head">
                            <div className="chip-row featured-chip-row">
                              <span className="soft-chip soft-chip-dark">{experience.category}</span>
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
                    <h2>Experiences</h2>
                  </div>
                  <span className="stat-pill">{currentCompany.name}</span>
                </div>
                <div className="list-stack">
                  {experiences
                    .filter((experience) => experience.companyId === currentCompany.id)
                    .map((experience) => (
                      <div className="list-row" key={experience.id}>
                        <div>
                          <strong>{experience.title}</strong>
                          <p>
                            {experience.category} • {experience.village} • {experience.duration}
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

          {currentUser.role === "ops" && activeTab === "experiences" ? (
            <>
              <section className="surface-card">
                <div className="section-head">
                  <div>
                    <h2>Catalog</h2>
                  </div>
                </div>
                <div className="list-stack">
                  {experiences.map((experience) => (
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
                            ? `${paymentStatusLabel(payment.status)} • ${formatCurrency(payment.cashPaidCents)} + ${payment.pointsUsed} pt`
                            : paymentStatusLabel(payment.status)}
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
                          <small>{paymentStatusLabel(payment.status)}</small>
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
