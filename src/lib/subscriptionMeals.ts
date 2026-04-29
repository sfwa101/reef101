import pChicken from "@/assets/p-grilled-chicken.jpg";
import pSalmon from "@/assets/p-salmon.jpg";
import pRisotto from "@/assets/p-risotto.jpg";
import pBowl from "@/assets/p-bowl.jpg";

/**
 * Single source of truth for subscription meals.
 * - Used by the Subscriptions page (daily meal picker) at the subscription price.
 * - Re-exposed inside Kitchen as standalone meals at a much higher single-order price.
 */
export type SubscriptionMeal = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
  calories: number;
  /** price when included in a subscription (per meal) */
  subscriptionPrice: number;
  /** price when ordered standalone from Kitchen — much higher */
  standalonePrice: number;
  tags: ("بروتين" | "خفيف" | "نباتي" | "صحي" | "كيتو" | "عائلي")[];
  fitsPlans: ("loss" | "maintain" | "muscle" | "family")[];
};

export const subscriptionMeals: SubscriptionMeal[] = [
  {
    id: "sub-chicken-herbs",
    name: "دجاج مشوي بالأعشاب وبطاطا حلوة",
    shortName: "دجاج بالأعشاب",
    description: "صدور دجاج مشوية مع بطاطا حلوة وخضار موسمية",
    image: pChicken,
    calories: 520,
    subscriptionPrice: 95,
    standalonePrice: 165,
    tags: ["بروتين", "صحي"],
    fitsPlans: ["maintain", "muscle", "family"],
  },
  {
    id: "sub-salmon-lemon",
    name: "سلمون مشوي بالليمون والكينوا",
    shortName: "سلمون بالليمون",
    description: "فيليه سلمون نرويجي مع كينوا وخضار مشوية",
    image: pSalmon,
    calories: 610,
    subscriptionPrice: 130,
    standalonePrice: 245,
    tags: ["بروتين", "كيتو", "صحي"],
    fitsPlans: ["maintain", "muscle"],
  },
  {
    id: "sub-risotto",
    name: "ريزوتو الفطر بالبارميزان",
    shortName: "ريزوتو الفطر",
    description: "ريزوتو إيطالي كريمي بالفطر الطازج والبارميزان",
    image: pRisotto,
    calories: 580,
    subscriptionPrice: 105,
    standalonePrice: 195,
    tags: ["نباتي"],
    fitsPlans: ["maintain", "family"],
  },
  {
    id: "sub-medi-bowl",
    name: "بول البحر المتوسط بالحمص والأفوكادو",
    shortName: "بول متوسطي",
    description: "كينوا، حمص، أفوكادو، خضار طازجة وصلصة طحينة",
    image: pBowl,
    calories: 420,
    subscriptionPrice: 85,
    standalonePrice: 155,
    tags: ["نباتي", "خفيف", "صحي"],
    fitsPlans: ["loss", "maintain"],
  },
  {
    id: "sub-chicken-bowl-light",
    name: "بول دجاج خفيف بالخضار",
    shortName: "بول دجاج لايت",
    description: "قطع دجاج مع خضار سوتيه وأرز بني (سعرات منخفضة)",
    image: pChicken,
    calories: 380,
    subscriptionPrice: 90,
    standalonePrice: 160,
    tags: ["بروتين", "خفيف", "صحي"],
    fitsPlans: ["loss", "maintain"],
  },
  {
    id: "sub-protein-power",
    name: "طبق البروتين القوي · لحم وأرز",
    shortName: "بروتين قوي",
    description: "لحم بقري مشوي مع أرز بسمتي وسلطة جانبية (للمتدربين)",
    image: pChicken,
    calories: 780,
    subscriptionPrice: 140,
    standalonePrice: 255,
    tags: ["بروتين", "عائلي"],
    fitsPlans: ["muscle", "family"],
  },
  {
    id: "sub-veggie-pasta",
    name: "باستا الخضار بصلصة الطماطم",
    shortName: "باستا خضار",
    description: "مكرونة بنّه بصلصة الطماطم الطازجة والريحان",
    image: pRisotto,
    calories: 540,
    subscriptionPrice: 80,
    standalonePrice: 145,
    tags: ["نباتي", "عائلي"],
    fitsPlans: ["maintain", "family"],
  },
  {
    id: "sub-keto-salmon-bowl",
    name: "بول كيتو بالسلمون والأفوكادو",
    shortName: "كيتو سلمون",
    description: "سلمون مع أفوكادو وخضار ورقية بدون كارب",
    image: pSalmon,
    calories: 490,
    subscriptionPrice: 135,
    standalonePrice: 235,
    tags: ["كيتو", "بروتين", "خفيف"],
    fitsPlans: ["loss", "maintain", "muscle"],
  },
];

export const getMealById = (id: string) =>
  subscriptionMeals.find((m) => m.id === id);
