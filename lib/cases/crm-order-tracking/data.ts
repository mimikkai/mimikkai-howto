export interface TrackingStep {
  status: string
  date: string
  city: string
}

export interface CrmOrder {
  id: number
  client: string
  city: string
  product: string
  orderNumber: string
  trackNumber: string
  notifyChannel: "telegram" | "email" | "whatsapp"
  deliveryStatus: "Принят" | "Сортировка" | "В пути" | "Доставка"
  eta: string
  trackingSteps: TrackingStep[]
}

const cities = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург",
  "Казань", "Краснодар", "Тула", "Нижний Новгород",
  "Самара", "Челябинск", "Ростов-на-Дону", "Уфа",
  "Воронеж", "Красноярск", "Пермь", "Волгоград",
]

const products = [
  "МФУ HP LaserJet Pro", "Монитор Dell 27\"", "Клавиатура Logitech MX",
  "Ноутбук Lenovo ThinkPad", "Принтер Canon PIXMA", "Веб-камера Logitech C920",
  "Проектор Epson EB-X51", "Стойка для ноутбука", "Наушники Jabra Evolve 75",
  "Маршрутизатор Cisco RV260", "Сервер Dell PowerEdge R740", "ИБП APC Smart-UPS 1500",
  "Планшет Samsung Galaxy Tab A8", "Сканер Fujitsu ScanSnap", "Телефон Yealink T46U",
  "Кресло Herman Miller Aeron", "Док-станция CalDigit TS4", "Веб-камера Poly Studio P15",
  "МФУ Xerox VersaLink C405", "Монитор LG 34\" UltraWide", "Клавиатура Keychron K8 Pro",
  "Принтер Brother HL-L2350DW", "Ноутбук Apple MacBook Air M2", "Маршрутизатор MikroTik hAP ax3",
  "ИП-камера Hikvision DS-2CD2143", "Сервер HP ProLiant DL380", "ИБП CyberPower CP1500",
  "Планшет Apple iPad 10th Gen", "Телефон Fanvil X3U", "Проектор BenQ MH535A",
]

const clients = [
  "ООО «ТехноПарк»", "АО «РосТелеком»", "ИП Сидоров К.А.",
  "ООО «СибИТ»", "ЗАО «УралПром»", "ООО «ВолгаСтрой»",
  "ПАО «КазаньИнвест»", "ООО «НордСервис»", "ИП Козлов М.В.",
  "ООО «ДонАгро»", "ЗАО «КрасноярскЭнерго»", "ООО «ПермТранс»",
  "АО «СамараЛогистик»", "ООО «ЧелябинскСталь»", "ИП Волков А.Н.",
  "ООО «РостовТрейд»", "ПАО «УфаХим»", "ООО «ВоронежТелеком»",
  "ЗАО «НовоМедиа»", "ООО «ЕкаСофт»", "ИП Морозов Д.С.",
  "ООО «ТулаМаш»", "ПАО «НижегородСвязь»", "ООО «МоскваИТ»",
  "ЗАО «ПитерДизайн»", "ООО «КрасСнаб»", "ИП Лебедев П.А.",
  "ООО «ОмскЛогистик»", "АО «ТюменьНефть»", "ООО «БашКредит»",
]

const channels: CrmOrder["notifyChannel"][] = [
  "telegram", "email", "whatsapp",
]

function generateTrackingSteps(city: string): TrackingStep[] {
  return [
    { status: "Принят", date: "09.06.2026", city: "Москва" },
    { status: "Сортировка", date: "10.06.2026", city: "Москва" },
    { status: "В пути", date: "10.06.2026", city: city },
    { status: "Доставка", date: "11.06.2026", city: city },
  ]
}

function generateEta(city: string): string {
  const days: Record<string, number> = {
    "Москва": 1, "Санкт-Петербург": 2, "Новосибирск": 4, "Екатеринбург": 3,
    "Казань": 2, "Краснодар": 2, "Тула": 1, "Нижний Новгород": 2,
    "Самара": 3, "Челябинск": 3, "Ростов-на-Дону": 2, "Уфа": 3,
    "Воронеж": 2, "Красноярск": 5, "Пермь": 3, "Волгоград": 3,
  }
  const d = days[city] ?? 3
  const date = new Date(2026, 5, 11 + d)
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const RAW_ORDERS: CrmOrder[] = Array.from({ length: 30 }, (_, i) => {
  const city = cities[i % cities.length]
  return {
    id: i + 1,
    client: clients[i],
    city,
    product: products[i],
    orderNumber: `ЗК-${String(1000 + i).padStart(5, "0")}`,
    trackNumber: `RU${String(7800000000 + i).padStart(13, "0")}`,
    notifyChannel: channels[i % 3],
    deliveryStatus: "Принят" as const,
    eta: generateEta(city),
    trackingSteps: generateTrackingSteps(city),
  }
})

export const CRM_ORDERS: CrmOrder[] = RAW_ORDERS

if (process.env.NODE_ENV !== "production") {
  console.debug("[crm-order-tracking:data] loaded", { count: CRM_ORDERS.length })
}