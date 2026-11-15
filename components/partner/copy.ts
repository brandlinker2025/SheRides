import type { Commitment, VehicleType } from "@/lib/partner-application";
import { ENABLE_CAR } from "@/lib/features";

export type PartnerLang = "bn" | "en";

export type PartnerCopy = {
  skip: string;
  nav: { home: string; apply: string; car: string; bike: string; office: string; guide: string };
  menu: string;
  closeMenu: string;
  hero: {
    badge: string;
    titleA: string;
    titleB: string;
    car: string;
    bike: string;
    intro: string;
    bullets: string[];
    partner: string;
    book: string;
    note: string;
    carAlt: string;
    bikeAlt: string;
  };
  paths: {
    title: string;
    sub: string;
    carTitle: string;
    carBody: string;
    carCta: string;
    bikeTitle: string;
    bikeBody: string;
    bikeCta: string;
  };
  types: {
    title: string;
    bikeTitle: string;
    bikeBody: string;
    carTitle: string;
    carBody: string;
    officeTitle: string;
    officeBody: string;
    start: string;
    noneTitle: string;
    noneBody: string;
    noneCta: string;
  };
  earnings: {
    title: string;
    body: string;
    part: string;
    full: string;
    partAmount: string;
    fullAmount: string;
    per: string;
    partHours: string;
    fullHours: string;
    disclaimer: string;
  };
  purpose: {
    title: string;
    body: string;
    cards: { title: string; body: string; icon: string }[];
  };
  how: {
    title: string;
    items: { title: string; body: string; icon: string }[];
  };
  fit: {
    title: string;
    body: string;
    points: string[];
    note: string;
  };
  process: { title: string; steps: string[] };
  finalCta: { title: string; body: string; cta: string; note: string };
  footer: { line: string; guide: string; apply: string; admin: string };
  form: {
    title: string;
    sub: string;
    name: string;
    phone: string;
    phoneHint: string;
    area: string;
    areaHint: string;
    vehicle: string;
    vehicles: Record<VehicleType, string>;
    commitment: string;
    commitments: Record<Commitment, string>;
    note: string;
    noteHint: string;
    submit: string;
    sending: string;
    successTitle: string;
    successBody: string;
    close: string;
    errors: Record<string, string>;
  };
};

const errorsBn = {
  name: "পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।",
  phone: "সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন (01XXXXXXXXX)।",
  area: "এলাকা বা শহরের নাম লিখুন।",
  vehicle: "যানবাহনের ধরন বেছে নিন।",
  commitment: "Part-time বা Full-time বেছে নিন।",
  note: "নোট ৫০০ অক্ষরের মধ্যে রাখুন।",
  forbidden: "এই আবেদনে পরিচয়পত্র, পাসওয়ার্ড বা পেমেন্ট নেওয়া হয় না।",
  rate: "একটু পরে আবার চেষ্টা করুন।",
  save: "এই মুহূর্তে আবেদন জমা হয়নি। আবার চেষ্টা করুন।",
};

const errorsEn = {
  name: "Enter your full name (at least 2 characters).",
  phone: "Enter a valid Bangladesh mobile number (01XXXXXXXXX).",
  area: "Enter your area or city.",
  vehicle: "Choose a vehicle type.",
  commitment: "Choose part-time or full-time.",
  note: "Keep the note within 500 characters.",
  forbidden: "This application does not collect ID, passwords, or payment details.",
  rate: "Please wait a little and try again.",
  save: "The application could not be saved just now. Please try again.",
};

export const partnerCopy: Record<PartnerLang, PartnerCopy> = {
  bn: {
    skip: "মূল অংশে যান",
    nav: {
      home: "হোম",
      apply: "আবেদন করুন",
      car: "নারী কার ড্রাইভার",
      bike: "নারী বাইক রাইডার",
      office: "অফিস কমিউটার",
      guide: "ড্রাইভার গাইড",
    },
    menu: "মেনু",
    closeMenu: "মেনু বন্ধ করুন",
    hero: {
      badge: "নারীদের জন্য, নারীদের দ্বারা",
      titleA: "নিরাপদ যাত্রা। উজ্জ্বল ভবিষ্যৎ।",
      titleB: "নারীর পাশে নারী।",
      car: "নারী কার ড্রাইভার",
      bike: "নারী বাইক / স্কুটার রাইডার",
      intro:
        "SheRides নারী যাত্রীদের যুক্ত করে বিশ্বস্ত নারী ড্রাইভার ও রাইডারদের সাথে। নিজের সময়ে আয় করুন এবং নারীদের নিরাপদ যাতায়াতে অবদান রাখুন।",
      bullets: [
        "নারীদের জন্য নিরাপদ রাইড",
        "নারীদের জন্য আয়ের সুযোগ",
        "যাচাইকৃত নারী ড্রাইভার ও রাইডার",
        "নারীর পাশে নারী",
      ],
      partner: "SheRides Partner হোন",
      book: "রাইড বুক করুন",
      note: "আমরা সবার সাথে কাজ করি না। আবেদন যাচাই করে উপযুক্ত Partner-দেরই SheRides Network-এ নেওয়া হয়।",
      carAlt: "নারী কার ড্রাইভার হিসেবে SheRides-এ আবেদন",
      bikeAlt: "নারী বাইক বা স্কুটার রাইডার হিসেবে SheRides-এ আবেদন",
    },
    paths: {
      title: "নারীরা দুইভাবে SheRides Partner হতে পারেন",
      sub: "দুটি পথই আমাদের কাছে সমান গুরুত্বপূর্ণ।",
      carTitle: "নারী কার ড্রাইভার",
      carBody: "নিজের গাড়ি চালিয়ে নারীদের নিরাপদ যাতায়াতে সাহায্য করে আয় করুন।",
      carCta: "কার ড্রাইভার হোন",
      bikeTitle: "নারী বাইক / স্কুটার রাইডার",
      bikeBody: "নিজের বাইক বা স্কুটার চালিয়ে নারীদের গন্তব্যে পৌঁছাতে সাহায্য করুন এবং আয় করুন।",
      bikeCta: "বাইক রাইডার হোন",
    },
    types: {
      title: "আপনি কোন ধরনের Partner?",
      bikeTitle: "আমার নিজের বাইক/স্কুটার আছে",
      bikeBody: "নিজের সময়ে SheRides-এর সাথে কাজ করুন।",
      carTitle: "আমার নিজের গাড়ি আছে",
      carBody: "নারী যাত্রীদের জন্য নিরাপদ ও নির্ভরযোগ্য পরিবহন দিন।",
      officeTitle: "আমি প্রতিদিন গাড়ি নিয়ে অফিসে যাই",
      officeBody: "আপনার নিয়মিত যাতায়াতের সাথে অতিরিক্ত আয়ের সুযোগ তৈরি করুন।",
      start: "শুরু করুন",
      noneTitle: "আমার গাড়ি/বাইক নেই",
      noneBody: "ভবিষ্যতে SheRides Partner হওয়ার সুযোগের জন্য আপনার তথ্য রেখে দিন।",
      noneCta: "তথ্য দিন",
    },
    earnings: {
      title: "আপনার অবসর সময়কে আয়ে পরিণত করুন",
      body: "আপনার নিজের গাড়ি বা বাইক আছে? প্রতিদিন কয়েক ঘণ্টা সময় দিতে পারলে SheRides-এর মাধ্যমে বাড়তি আয়ের সুযোগ তৈরি করুন।",
      part: "Part-time Partner",
      full: "Full-time Partner",
      partAmount: "৳15,000–20,000+",
      fullAmount: "৳30,000–40,000+",
      per: "/ মাস",
      partHours: "দিনে ৪–৫ ঘণ্টা",
      fullHours: "দিনে ৯–১০ ঘণ্টা",
      disclaimer: "সম্ভাব্য আয়। প্রকৃত আয় নির্ভর করবে availability, completed rides, route এবং demand-এর উপর।",
    },
    purpose: {
      title: "শুধু আয় নয়। একজন নারীর যাত্রার অংশ হোন।",
      body: "প্রতিদিন অসংখ্য নারী অফিস, বিশ্ববিদ্যালয়, স্কুল, হাসপাতাল এবং বিভিন্ন কাজে যাতায়াত করেন। তাদের জন্য নিরাপদ ও নির্ভরযোগ্য পরিবহন শুধু একটি রাইড নয় — এটি স্বাধীনভাবে চলাফেরার একটি সুযোগ। SheRides Partner হিসেবে আপনি সেই যাত্রার অংশ।",
      cards: [
        {
          title: "নিরাপদ যাতায়াত",
          body: "নারীদের জন্য আরও নিরাপদ ও নির্ভরযোগ্য পরিবহন ব্যবস্থা গড়ে তুলতে সাহায্য করুন।",
          icon: "shield_with_heart",
        },
        {
          title: "সম্মানজনক কাজ",
          body: "আপনার সময় ও দক্ষতাকে এমন একটি কাজে ব্যবহার করুন যার বাস্তব উপকার আছে।",
          icon: "volunteer_activism",
        },
        {
          title: "বাড়তি আয়",
          body: "আপনার অবসর সময়কে অতিরিক্ত আয়ের সুযোগে পরিণত করুন।",
          icon: "account_balance_wallet",
        },
      ],
    },
    how: {
      title: "SheRides কীভাবে কাজ করে?",
      items: [
        { title: "Pre-booked rides", body: "যাত্রীরা আগে থেকেই রাইড বুক করেন।", icon: "event_available" },
        { title: "Planned trips", body: "রাইডগুলো আগে থেকে পরিকল্পনা ও সমন্বয় করা হয়।", icon: "schedule" },
        { title: "Selected Partners", body: "আমরা আবেদন যাচাই করে উপযুক্ত Partner-দের সাথে কাজ করি।", icon: "how_to_reg" },
        { title: "Women-focused", body: "আমাদের পরিবহন সেবার মূল লক্ষ্য নারীদের নিরাপদ চলাচল।", icon: "diversity_3" },
        { title: "Repeat relationships", body: "ভালো সার্ভিস দিলে একই যাত্রীদের সাথে নিয়মিত কাজের সুযোগ তৈরি হতে পারে।", icon: "autorenew" },
      ],
    },
    fit: {
      title: "SheRides Partner হওয়া সবার জন্য নয়।",
      body: "আমরা শুধু বেশি Driver চাই না। আমরা এমন মানুষ খুঁজছি যারা সময়নিষ্ঠ, দায়িত্বশীল এবং নারীদের সাথে সম্মানের সাথে কাজ করতে আগ্রহী।",
      points: [
        "সময়নিষ্ঠ",
        "দায়িত্বশীল",
        "ভদ্র ও সম্মানজনক আচরণ",
        "নিরাপদ ড্রাইভিং অভ্যাস",
        "নিয়মিত সময় দিতে আগ্রহী",
        "যাচাই প্রক্রিয়ায় সহযোগিতা করতে প্রস্তুত",
      ],
      note: "আপনার আবেদন যাচাই করে SheRides সিদ্ধান্ত নেবে আপনি আমাদের Partner Network-এর জন্য উপযুক্ত কিনা।",
    },
    process: {
      title: "SheRides Partner হওয়ার প্রক্রিয়া",
      steps: [
        "আবেদন করুন",
        "ফোনে কথা বলুন",
        "তথ্য ও ডকুমেন্ট যাচাই",
        "Partner হিসেবে নির্বাচিত হন",
        "আপনার availability জানান",
        "উপযুক্ত ride opportunity পান",
        "যাত্রীকে নিরাপদে পৌঁছে দিন",
        "আয় করুন এবং এগিয়ে যান",
      ],
    },
    finalCta: {
      title: "আপনার গাড়ি বা বাইক কি আপনার জন্য আরও আয় করতে পারে?",
      body: "SheRides Partner হিসেবে আবেদন করুন এবং নারীদের নিরাপদ যাতায়াতে আপনার ভূমিকা রাখুন।",
      cta: "SheRides Partner হোন",
      note: "আবেদন করা ফ্রি। আবেদন যাচাই করে উপযুক্ত প্রার্থীদের সাথে SheRides যোগাযোগ করবে।",
    },
    footer: {
      line: "SheRides-এর সাথে নিরাপদ ও স্মার্ট যাত্রা।",
      guide: "ড্রাইভার গাইড",
      apply: "আবেদন করুন",
      admin: "অ্যাডমিন",
    },
    form: {
      title: "Partner আবেদন",
      sub: "আবেদন ফ্রি। NID, লাইসেন্সের ছবি, পাসওয়ার্ড বা পেমেন্ট নেওয়া হয় না।",
      name: "পূর্ণ নাম",
      phone: "মোবাইল নম্বর",
      phoneHint: "01XXXXXXXXX",
      area: "এলাকা / শহর",
      areaHint: "যেমন ধানমন্ডি, ঢাকা",
      vehicle: "যানবাহন",
      vehicles: { car: "গাড়ি", bike_scooter: "বাইক / স্কুটার", none: "নেই" },
      commitment: "কতটা সময় দিতে পারবেন?",
      commitments: { part_time: "Part-time", full_time: "Full-time" },
      note: "সংক্ষিপ্ত নোট",
      noteHint: "ঐচ্ছিক",
      submit: "আবেদন পাঠান",
      sending: "পাঠানো হচ্ছে…",
      successTitle: "আবেদন পৌঁছেছে",
      successBody: "SheRides আবেদন যাচাই করে উপযুক্ত প্রার্থীদের সাথে যোগাযোগ করবে।",
      close: "বন্ধ করুন",
      errors: errorsBn,
    },
  },
  en: {
    skip: "Skip to content",
    nav: {
      home: "Home",
      apply: "Apply",
      car: "Women car drivers",
      bike: "Women bike riders",
      office: "Office commuter",
      guide: "Driver guide",
    },
    menu: "Menu",
    closeMenu: "Close menu",
    hero: {
      badge: "For women, by women",
      titleA: "Safe journeys. A brighter future.",
      titleB: "Women beside women.",
      car: "Women car driver",
      bike: "Women bike / scooter rider",
      intro:
        "SheRides connects women passengers with trusted women drivers and riders. Earn on your own time and help women travel safely.",
      bullets: [
        "Safe rides for women",
        "Earning opportunities for women",
        "Verified women drivers and riders",
        "Women beside women",
      ],
      partner: "Become a SheRides Partner",
      book: "Book a ride",
      note: "We do not work with everyone. Applications are reviewed, and only suitable Partners join the SheRides Network.",
      carAlt: "Apply to SheRides as a women car driver",
      bikeAlt: "Apply to SheRides as a women bike or scooter rider",
    },
    paths: {
      title: "Women can become a SheRides Partner in two ways",
      sub: "Both paths matter equally to us.",
      carTitle: "Women car driver",
      carBody: "Drive your own car, help women travel safely, and earn.",
      carCta: "Become a car driver",
      bikeTitle: "Women bike / scooter rider",
      bikeBody: "Ride your own bike or scooter, help women reach their destination, and earn.",
      bikeCta: "Become a bike rider",
    },
    types: {
      title: "What kind of Partner are you?",
      bikeTitle: "I have my own bike/scooter",
      bikeBody: "Work with SheRides on your own time.",
      carTitle: "I have my own car",
      carBody: "Offer safe, reliable transport for women passengers.",
      officeTitle: "I drive to the office every day",
      officeBody: "Turn your regular commute into extra income.",
      start: "Get started",
      noneTitle: "I don't have a car or bike",
      noneBody: "Leave your details for a future chance to become a SheRides Partner.",
      noneCta: "Share your details",
    },
    earnings: {
      title: "Turn spare time into income",
      body: "Have your own car or bike? A few hours a day with SheRides can become extra income.",
      part: "Part-time Partner",
      full: "Full-time Partner",
      partAmount: "৳15,000–20,000+",
      fullAmount: "৳30,000–40,000+",
      per: "/ month",
      partHours: "4–5 hours a day",
      fullHours: "9–10 hours a day",
      disclaimer: "Potential earnings. Actual income depends on availability, completed rides, route, and demand.",
    },
    purpose: {
      title: "More than income. Be part of a woman's journey.",
      body: "Every day, women travel to offices, universities, schools, hospitals, and other work. Safe, reliable transport is not just a ride — it is a way to move freely. As a SheRides Partner, you are part of that journey.",
      cards: [
        {
          title: "Safer travel",
          body: "Help build transport that women can rely on.",
          icon: "shield_with_heart",
        },
        {
          title: "Dignified work",
          body: "Use your time and skill for work that has a real benefit.",
          icon: "volunteer_activism",
        },
        {
          title: "Extra income",
          body: "Turn spare hours into an additional earning opportunity.",
          icon: "account_balance_wallet",
        },
      ],
    },
    how: {
      title: "How does SheRides work?",
      items: [
        { title: "Pre-booked rides", body: "Passengers book the ride ahead of time.", icon: "event_available" },
        { title: "Planned trips", body: "Rides are planned and coordinated in advance.", icon: "schedule" },
        { title: "Selected Partners", body: "We review applications and work with suitable Partners.", icon: "how_to_reg" },
        { title: "Women-focused", body: "The point of the service is safer movement for women.", icon: "diversity_3" },
        { title: "Repeat relationships", body: "Good service can lead to regular work with the same passengers.", icon: "autorenew" },
      ],
    },
    fit: {
      title: "Being a SheRides Partner is not for everyone.",
      body: "We are not looking for more drivers. We are looking for people who are punctual, responsible, and ready to treat women with respect.",
      points: [
        "Punctual",
        "Responsible",
        "Polite and respectful",
        "Safe driving habits",
        "Ready to give time regularly",
        "Prepared to cooperate with verification",
      ],
      note: "SheRides reviews your application and decides whether you are a fit for the Partner Network.",
    },
    process: {
      title: "How you become a SheRides Partner",
      steps: [
        "Apply",
        "Talk on the phone",
        "Information and document check",
        "Selected as a Partner",
        "Share your availability",
        "Receive a suitable ride opportunity",
        "Take the passenger there safely",
        "Earn and keep going",
      ],
    },
    finalCta: {
      title: "Could your car or bike earn more for you?",
      body: "Apply as a SheRides Partner and take your place in safer journeys for women.",
      cta: "Become a SheRides Partner",
      note: "Applying is free. SheRides reviews applications and contacts suitable candidates.",
    },
    footer: {
      line: "Safe, smart journeys with SheRides.",
      guide: "Driver guide",
      apply: "Apply",
      admin: "Admin",
    },
    form: {
      title: "Partner application",
      sub: "Applying is free. We do not collect NID, licence photos, passwords, or payment details.",
      name: "Full name",
      phone: "Mobile number",
      phoneHint: "01XXXXXXXXX",
      area: "Area / city",
      areaHint: "For example Dhanmondi, Dhaka",
      vehicle: "Vehicle",
      vehicles: { car: "Car", bike_scooter: "Bike / scooter", none: "None" },
      commitment: "How much time can you give?",
      commitments: { part_time: "Part-time", full_time: "Full-time" },
      note: "Short note",
      noteHint: "Optional",
      submit: "Send application",
      sending: "Sending…",
      successTitle: "Application received",
      successBody: "SheRides will review it and contact suitable candidates.",
      close: "Close",
      errors: errorsEn,
    },
  },
};

/** Copy shown in the UI. Car phrases stay in `partnerCopy` so the flag can turn them back on. */
export function shownPartnerCopy(lang: PartnerLang): PartnerCopy {
  const copy = partnerCopy[lang];
  if (ENABLE_CAR) return copy;
  if (lang === "bn") {
    return {
      ...copy,
      paths: {
        ...copy.paths,
        title: "বাইক বা স্কুটার নিয়ে SheRides Partner হোন",
        sub: "নারী বাইক ও স্কুটার রাইডারদের আমরা স্বাগত জানাই।",
      },
      types: { ...copy.types, noneTitle: "আমার বাইক বা স্কুটার নেই" },
      earnings: {
        ...copy.earnings,
        body: "আপনার নিজের বাইক বা স্কুটার আছে? প্রতিদিন কয়েক ঘণ্টা সময় দিতে পারলে SheRides-এর মাধ্যমে বাড়তি আয়ের সুযোগ তৈরি করুন।",
      },
      finalCta: { ...copy.finalCta, title: "আপনার বাইক বা স্কুটার কি আপনার জন্য আরও আয় করতে পারে?" },
      footer: { ...copy.footer, guide: "রাইডার গাইড" },
    };
  }
  return {
    ...copy,
    paths: {
      ...copy.paths,
      title: "Become a SheRides Partner with a bike or scooter",
      sub: "Women bike and scooter riders are welcome.",
    },
    types: { ...copy.types, noneTitle: "I don't have a bike or scooter" },
    earnings: {
      ...copy.earnings,
      body: "Have your own bike or scooter? A few hours a day with SheRides can become extra income.",
    },
    finalCta: { ...copy.finalCta, title: "Could your bike or scooter earn more for you?" },
    footer: { ...copy.footer, guide: "Rider guide" },
    fit: { ...copy.fit, body: "We are looking for people who are punctual, responsible, and ready to treat women with respect." },
  };
}
