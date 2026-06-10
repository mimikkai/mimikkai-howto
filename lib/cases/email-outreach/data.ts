export interface EmailContact {
  id: number
  sphere: string
  senderName: string
  caseUsed: string
  company: string
  site: string
  email: string
  phone: string
  letter1: string
  sendStatus: string
  letter2: string
  letter3: string
  letter4: string
}

const templateLetter1 = (company: string, sphere: string, senderName: string) =>
  `Subject: ai-агент под вашу рутину\n\nДобрый день,\n\nЯ ${senderName} из MimikkAi — платформы, на которой компании создают AI-агентов под рутинные задачи.\n\nВажный момент: агента может создать не только технический специалист. Это может быть руководитель департамента, бухгалтер, менеджер или любой сотрудник, который хорошо знает свой процесс. Главное — качественно описать порядок действий: куда зайти, что проверить, какие данные перенести, какие ошибки бывают и какой результат нужен на выходе. Сделать это можно за пару текстовых запросов, без кода и технических навыков.\n\nМы внимательно изучили ваш сайт и видим, что в сфере «${sphere}» есть типовые процессы, которые регулярно отнимают время.\n\nAI-агенты MimikkAi могут работать как человек в браузере: открывать сайты и личные кабинеты, заполнять заявки, переносить данные в таблицы, готовить письма, проверять статусы и выполнять другие повторяющиеся действия.\n\nЕсли вас это заинтересовало, давайте договоримся о небольшой 20-минутной встрече, на которой мы продемонстрируем процесс создания агентов и их работу. В качестве демонстрации можем собрать простую автоматизацию любой вашей рутинной задачи.\n\nС уважением,\n${senderName}\nMimikkAi\nhttps://mimikkai.ru/`

const templateLetter2 = (company: string, caseUsed: string) =>
  `Subject: пример простой автоматизации\n\nДобрый день,\n\nПродолжу коротко.\n\nMimikkAi нужен не для одной конкретной отрасли, а для любых процессов, где сотрудник делает одно и то же вручную.\n\nНапример, ${caseUsed}: AI-агент ищет компании по заданной сфере, изучает сайты, собирает контакты, проверяет открытые данные и готовит персонализированное письмо под каждую компанию.\n\nДля ${company} логика может быть похожей: автоматический сбор и квалификация входящих заявок из разных каналов\n\nГлавное — не нужно начинать с большой интеграции. Достаточно взять одну понятную задачу, подробно описать действия сотрудника, собрать агента и проверить результат на реальном процессе.\n\nПосмотреть платформу можно здесь: https://mimikkai.ru/`

const templateLetter3 = (company: string) =>
  `Subject: как создаётся агент\n\nДобрый день,\n\nВажный момент: агента в MimikkAi может создать не только технический специалист.\n\nЧаще всего лучший сценарий описывает именно тот сотрудник, который каждый день выполняет задачу руками. Он знает, куда заходить, что копировать, где проверять статус, какие ошибки бывают и какой результат нужен на выходе.\n\nЭтого описания достаточно, чтобы собрать агента, который будет повторять процесс без ручной нагрузки.\n\nЕсли у ${company} есть хотя бы одна такая регулярная задача, можем разобрать её на встрече и показать, как из описания получается рабочий агент.`

const templateLetter4 = () =>
  `Subject: финально про mimikkai\n\nДобрый день,\n\nНапишу финально и больше не буду отвлекать.\n\nMimikkAi — это простой способ начать внедрение искусственного интеллекта не с большой разработки, а с одной рутинной задачи.\n\nВы выбираете процесс, сотрудник подробно описывает его шаг за шагом, мы показываем, как под него создаётся AI-агент, и дальше можно понять, насколько такой подход полезен для команды.\n\nЕсли тема появится позже, сайт здесь: https://mimikkai.ru/\n\nСпасибо, что уделили время.`

const RAW_CONTACTS: Omit<
  EmailContact,
  "letter1" | "letter2" | "letter3" | "letter4" | "sendStatus"
>[] = [
  { id: 1, sphere: "Финансы", senderName: "Андрей", caseUsed: "Лидогенерация", company: "Тинькофф", site: "https://tinkoff.ru", email: "partnership@tinkoff.ru", phone: "+7 495 645-59-09" },
  { id: 2, sphere: "Финансы", senderName: "Андрей", caseUsed: "Лидогенерация", company: "Альфа-Банк", site: "https://alfabank.ru", email: "corp@alfabank.ru", phone: "+7 495 788-88-78" },
  { id: 3, sphere: "Потребительские товары", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "Чёрный Кардинал", site: "https://blackcardinal.ru", email: "info@blackcardinal.ru", phone: "+7 495 123-45-67" },
  { id: 4, sphere: "Автопром", senderName: "Андрей", caseUsed: "Любая рутина", company: "АвтоВАЗ", site: "https://avtovaz.ru", email: "press@avtovaz.ru", phone: "+7 8482 79-01-01" },
  { id: 5, sphere: "Фарма", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "Фармстандарт", site: "https://pharmstd.ru", email: "info@pharmstd.ru", phone: "+7 495 956-80-70" },
  { id: 6, sphere: "Юридические услуги", senderName: "Андрей", caseUsed: "Лидогенерация", company: "Алруд", site: "https://alrud.ru", email: "contact@alrud.ru", phone: "+7 495 935-74-79" },
  { id: 7, sphere: "Медицинские услуги", senderName: "Андрей", caseUsed: "Любая рутина", company: "СМ-Клиника", site: "https://sm-clinic.ru", email: "info@sm-clinic.ru", phone: "+7 495 777-77-77" },
  { id: 8, sphere: "Туристические услуги", senderName: "Андрей", caseUsed: "Контент и постинг", company: "БайкалБизнесЦентр", site: "https://bbc-tur.ru", email: "info@bbc-tur.ru", phone: "+7 3952 25-25-25" },
  { id: 9, sphere: "Образовательные услуги", senderName: "Андрей", caseUsed: "Квалификация лидов", company: "Нетология", site: "https://netology.ru", email: "partner@netology.ru", phone: "+7 495 532-13-22" },
  { id: 10, sphere: "Маркетинг", senderName: "Андрей", caseUsed: "Контент и постинг", company: "Ingate", site: "https://ingate.ru", email: "info@ingate.ru", phone: "+7 495 232-33-44" },
  { id: 11, sphere: "Финансы", senderName: "Андрей", caseUsed: "Квалификация лидов", company: "Сбер", site: "https://sberbank.ru", email: "partnership@sberbank.ru", phone: "+7 495 500-55-50" },
  { id: 12, sphere: "Логистика", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "СДЭК", site: "https://cdek.ru", email: "b2b@cdek.ru", phone: "+7 495 786-85-85" },
  { id: 13, sphere: "IT-услуги", senderName: "Андрей", caseUsed: "Лидогенерация", company: "Selectel", site: "https://selectel.ru", email: "sales@selectel.ru", phone: "+7 812 425-65-65" },
  { id: 14, sphere: "Розничная торговля", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "DNS", site: "https://dns-shop.ru", email: "info@dns-shop.ru", phone: "+7 800 770-79-99" },
  { id: 15, sphere: "Строительство", senderName: "Андрей", caseUsed: "Квалификация лидов", company: "ПИК", site: "https://pik.ru", email: "info@pik.ru", phone: "+7 495 505-97-97" },
  { id: 16, sphere: "Сельское хозяйство", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "Мираторг", site: "https://miratorg.ru", email: "info@miratorg.ru", phone: "+7 495 651-92-92" },
  { id: 17, sphere: "Телеком", senderName: "Андрей", caseUsed: "Лидогенерация", company: "МТС", site: "https://mts.ru", email: "b2b@mts.ru", phone: "+7 800 250-08-90" },
  { id: 18, sphere: "Энергетика", senderName: "Андрей", caseUsed: "Любая рутина", company: "Россети", site: "https://rosseti.ru", email: "info@rosseti.ru", phone: "+7 495 995-95-95" },
  { id: 19, sphere: "SMM", senderName: "Андрей", caseUsed: "Контент и постинг", company: "Pichesky", site: "https://pichesky.agency", email: "hi@pichesky.agency", phone: "+7 495 888-99-00" },
  { id: 20, sphere: "Страхование", senderName: "Андрей", caseUsed: "Квалификация лидов", company: "Ингосстрах", site: "https://ingos.ru", email: "info@ingos.ru", phone: "+7 495 956-77-77" },
  { id: 21, sphere: "Производство", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "Уралвагонзавод", site: "https://uvz.ru", email: "info@uvz.ru", phone: "+7 343 353-04-30" },
  { id: 22, sphere: "Недвижимость", senderName: "Андрей", caseUsed: "Лидогенерация", company: "Самолёт", site: "https://samolet.ru", email: "info@samolet.ru", phone: "+7 495 132-44-44" },
  { id: 23, sphere: "HoReCa", senderName: "Андрей", caseUsed: "Квалификация лидов", company: "Dodo Brands", site: "https://dodobrands.io", email: "info@dodobrands.io", phone: "+7 800 333-00-66" },
  { id: 24, sphere: "Медиа", senderName: "Андрей", caseUsed: "Контент и постинг", company: "РИА Новости", site: "https://ria.ru", email: "info@ria.ru", phone: "+7 495 645-65-65" },
  { id: 25, sphere: "Госсектор", senderName: "Андрей", caseUsed: "Любая рутина", company: "Госуслуги", site: "https://gosuslugi.ru", email: "support@gosuslugi.ru", phone: "+7 800 100-70-10" },
  { id: 26, sphere: "Консалтинг", senderName: "Андрей", caseUsed: "Лидогенерация", company: "ДРТ", site: "https://delitte.ru", email: "info@delitte.ru", phone: "+7 495 787-06-00" },
  { id: 27, sphere: "E-commerce", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "Ozon", site: "https://ozon.ru", email: "seller@ozon.ru", phone: "+7 800 500-95-95" },
  { id: 28, sphere: "E-commerce", senderName: "Андрей", caseUsed: "Мониторинг цен", company: "Wildberries", site: "https://wildberries.ru", email: "seller@wildberries.ru", phone: "+7 495 665-08-08" },
  { id: 29, sphere: "Транспорт", senderName: "Андрей", caseUsed: "Любая рутина", company: "РЖД", site: "https://rzd.ru", email: "info@rzd.ru", phone: "+7 800 775-00-00" },
  { id: 30, sphere: "Образование", senderName: "Андрей", caseUsed: "Квалификация лидов", company: "Skillbox", site: "https://skillbox.ru", email: "partner@skillbox.ru", phone: "+7 495 120-40-40" },
]

export const EMAIL_CONTACTS: EmailContact[] = RAW_CONTACTS.map((c) => ({
  ...c,
  letter1: templateLetter1(c.company, c.sphere, c.senderName),
  letter2: templateLetter2(c.company, c.caseUsed),
  letter3: templateLetter3(c.company),
  letter4: templateLetter4(),
  sendStatus: "ожидает",
}))

if (process.env.NODE_ENV !== "production") {
  console.debug("[email-outreach:data] loaded", { count: EMAIL_CONTACTS.length })
}
