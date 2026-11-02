import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Mail, Phone, MapPin } from 'lucide-react-native';

const EFFECTIVE = 'June 2026';
const EMAIL = 'support@exploreaba.ng';
const PHONE = '09061355240';
const ADDRESS = 'Ariaria International Market, Aba, Abia State, Nigeria';
const WEBSITE = 'www.exploreaba.ng';

const SECTIONS = [
  { id: 'terms', label: 'Terms', emoji: '📋' },
  { id: 'privacy', label: 'Privacy', emoji: '🔒' },
  { id: 'returns', label: 'Returns', emoji: '📦' },
  { id: 'refunds', label: 'Refunds', emoji: '💳' },
  { id: 'cookies', label: 'Cookies', emoji: '🍪' },
];

/* ── Building blocks ─────────────────────────────────────────── */
function H3({ children }) {
  return (
    <Text className="text-[15px] font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100">
      {children}
    </Text>
  );
}

function P({ children }) {
  return <Text className="text-sm text-gray-600 leading-relaxed">{children}</Text>;
}

function Bullets({ items }) {
  return (
    <View className="mt-2 gap-1.5">
      {items.map((item, i) => (
        <View key={i} className="flex-row gap-2">
          <Text className="text-green-600 font-bold">›</Text>
          <Text className="flex-1 text-sm text-gray-600 leading-relaxed">{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Steps({ steps }) {
  return (
    <View className="mt-3 gap-3">
      {steps.map(({ n, text }) => (
        <View key={n} className="flex-row gap-3">
          <View className="w-7 h-7 rounded-lg bg-blue-600 items-center justify-center">
            <Text className="text-white text-xs font-black">{n}</Text>
          </View>
          <Text className="flex-1 text-sm text-gray-600 leading-relaxed pt-0.5">{text}</Text>
        </View>
      ))}
    </View>
  );
}

const BOX_COLORS = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-800' },
};

function InfoBox({ color = 'blue', children }) {
  const c = BOX_COLORS[color];
  return (
    <View className={`p-4 border rounded-xl ${c.bg} ${c.border}`}>
      <Text className={`text-sm leading-relaxed ${c.text}`}>{children}</Text>
    </View>
  );
}

function ContactBox() {
  return (
    <View className="mt-1 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <Text className="text-sm font-bold text-gray-800 mb-3">Contact Us</Text>
      <View className="gap-2">
        <Pressable onPress={() => Linking.openURL(`mailto:${EMAIL}`)} className="flex-row items-center gap-2">
          <Mail size={14} color="#22c55e" />
          <Text className="text-sm text-gray-600">{EMAIL}</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(`tel:${PHONE}`)} className="flex-row items-center gap-2">
          <Phone size={14} color="#22c55e" />
          <Text className="text-sm text-gray-600">{PHONE}</Text>
        </Pressable>
        <View className="flex-row items-start gap-2">
          <MapPin size={14} color="#22c55e" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-sm text-gray-600">{ADDRESS}</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Sections ─────────────────────────────────────────────────── */
function TermsSection() {
  return (
    <View className="gap-5">
      <View>
        <H3>1. Introduction</H3>
        <P>
          Welcome to ExploreAba ("we", "our", "us"). These Terms and Conditions govern your use of{' '}
          {WEBSITE} and your purchase of products from us. By accessing our website or app or placing an
          order, you agree to be bound by these Terms in full. If you do not agree, please stop using our
          services.
        </P>
      </View>

      <View>
        <H3>2. About ExploreAba</H3>
        <P>
          ExploreAba is a Nigerian e-commerce marketplace specialising in authentic, Aba-manufactured
          products — including leather goods, footwear, clothing, accessories, and bespoke/custom-made
          fashion. We are based at {ADDRESS}.
        </P>
      </View>

      <View>
        <H3>3. Eligibility</H3>
        <P>By using our website or app, you confirm that:</P>
        <Bullets items={[
          'You are at least 18 years old, or are accessing the service under the supervision of a parent or legal guardian.',
          'You are located in Nigeria or a country where purchasing from us is legally permitted.',
          'All information you provide to us is accurate, complete, and truthful.',
        ]} />
      </View>

      <View>
        <H3>4. Products and Descriptions</H3>
        <P>We make every reasonable effort to display products accurately. However:</P>
        <Bullets items={[
          "Colours may appear differently depending on your screen's display settings.",
          'Product availability is subject to change without prior notice.',
          'Custom/bespoke items are handcrafted to your specification and may have minor natural variations from reference samples.',
          'Product images are for illustration; the finished item may differ slightly in texture or shade.',
        ]} />
      </View>

      <View>
        <H3>5. Pricing and Payment</H3>
        <Bullets items={[
          'All prices are in Nigerian Naira (₦) and include applicable charges unless stated otherwise.',
          'We may update prices at any time, but changes will not affect orders already confirmed.',
          'Payments are processed securely through Paystack. We never store your full card details.',
          'For custom orders, a deposit (agreed at the time of ordering) is required before production begins.',
          'We accept Visa, Mastercard, and bank transfers via Paystack.',
        ]} />
      </View>

      <View>
        <H3>6. Order Confirmation</H3>
        <P>
          Adding items to your cart does not constitute a confirmed order. Your order is confirmed only
          when you receive an order confirmation from us. We reserve the right to refuse or cancel any
          order — for example, due to pricing errors, stock unavailability, or suspected fraud. In such
          cases, a full refund of any amount paid will be issued promptly.
        </P>
      </View>

      <View>
        <H3>7. Custom & Bespoke Orders</H3>
        <P>Custom orders are produced specifically to your measurements, design, or instructions. Please read these terms carefully before placing a custom order:</P>
        <Bullets items={[
          'A deposit (typically 50% of the total order value) is required before production begins. The exact amount will be confirmed when you place your order.',
          'Production lead times are typically 7–21 business days depending on complexity. An estimated completion date will be communicated at the time of order.',
          'You are responsible for providing accurate measurements and design details. We are not liable for fit or design issues arising from incorrect information you provide.',
          'Changes to design or specifications cannot be made once production has started.',
          'Custom orders are non-returnable and non-refundable once production has commenced, except in the case of a verified manufacturing defect on our part.',
        ]} />
      </View>

      <View>
        <H3>8. Delivery</H3>
        <Bullets items={[
          'We deliver nationwide across Nigeria via third-party logistics partners.',
          'Delivery timeframes are estimates, not guarantees. We are not liable for delays caused by logistics partners, weather, public holidays, or other factors outside our control.',
          'Risk of loss or damage passes to you upon delivery to the address you provided.',
          'It is your responsibility to ensure that someone is available to receive the delivery.',
        ]} />
      </View>

      <View>
        <H3>9. Intellectual Property</H3>
        <P>
          All content on our website and app — including text, images, logos, product photography, and
          branding — belongs to ExploreAba or our licensed suppliers and is protected under applicable
          Nigerian and international intellectual property laws. You may not reproduce, copy, distribute,
          or use our content for any commercial or public purpose without our prior written consent.
        </P>
      </View>

      <View>
        <H3>10. Limitation of Liability</H3>
        <Bullets items={[
          'To the fullest extent permitted by law, ExploreAba shall not be liable for indirect, incidental, consequential, or punitive damages arising from your use of our website, app, or products.',
          'Our total liability in relation to any specific order shall not exceed the amount you paid for that order.',
          'We are not responsible for losses arising from your reliance on information on our website or app that you have not independently verified.',
        ]} />
      </View>

      <View>
        <H3>11. Governing Law</H3>
        <P>
          These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be
          subject to the exclusive jurisdiction of the courts of Abia State, Nigeria. We encourage you to
          contact us first so we can resolve any issue amicably before formal proceedings are pursued.
        </P>
      </View>

      <View>
        <H3>12. Updates to These Terms</H3>
        <P>
          We may revise these Terms at any time. The updated version will be published on this page with
          a revised effective date. Your continued use of our website or app after changes are posted
          constitutes acceptance of the revised Terms.
        </P>
      </View>

      <ContactBox />
    </View>
  );
}

function PrivacySection() {
  return (
    <View className="gap-5">
      <InfoBox color="blue">
        ExploreAba is committed to protecting your personal data in compliance with the Nigeria Data
        Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act (NDPA) 2023.
      </InfoBox>

      <View>
        <H3>1. Data We Collect</H3>
        <Text className="text-sm font-semibold text-gray-800 mb-1">Personal Information</Text>
        <Bullets items={['Full name', 'Email address', 'Phone number', 'Delivery address']} />

        <Text className="text-sm font-semibold text-gray-800 mt-4 mb-1">Order Information</Text>
        <Bullets items={[
          'Products purchased and order history',
          'Payment transaction references (we never store full card numbers)',
          'Support and communication history',
        ]} />

        <Text className="text-sm font-semibold text-gray-800 mt-4 mb-1">Technical Information</Text>
        <Bullets items={[
          'IP address and device/browser type',
          'Pages and screens visited and time spent in the app',
          'Device type and operating system',
        ]} />
      </View>

      <View>
        <H3>2. How We Use Your Data</H3>
        <Bullets items={[
          'To process and fulfil your orders, and send you confirmations and delivery updates',
          'To handle your customer service enquiries promptly',
          'To send marketing communications — only where you have given explicit consent',
          'To improve our website, app, and overall shopping experience',
          'To detect and prevent fraud or abuse',
          'To comply with legal and regulatory obligations under Nigerian law',
        ]} />
      </View>

      <View>
        <H3>3. Legal Basis for Processing</H3>
        <View className="mt-2 gap-2.5">
          {[
            ['Contract', 'Necessary to fulfil the orders you place with us'],
            ['Legitimate Interest', 'Improving our services and preventing fraud'],
            ['Consent', 'Marketing communications — you may withdraw at any time by emailing us'],
            ['Legal Obligation', 'Compliance with Nigerian law and regulatory requirements'],
          ].map(([basis, reason]) => (
            <View key={basis} className="flex-row gap-2">
              <Text className="font-bold text-gray-800 w-32">{basis}:</Text>
              <Text className="flex-1 text-sm text-gray-600">{reason}</Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        <H3>4. Who We Share Your Data With</H3>
        <P>We do not sell your personal data. We may share it only where strictly necessary:</P>
        <Bullets items={[
          'Paystack — for secure payment processing',
          'Delivery and logistics partners — to arrange and track your shipment',
          'Technology and hosting providers — who power our website, app, and email systems',
          'Nigerian law enforcement or regulatory bodies — where legally required',
        ]} />
        <Text className="text-sm text-gray-600 mt-1">
          All third parties are contractually required to keep your data secure and use it only for the agreed purpose.
        </Text>
      </View>

      <View>
        <H3>5. Data Retention</H3>
        <Bullets items={[
          'Order records: retained for 5 years for accounting and compliance purposes',
          'Account data: retained until you request deletion or close your account',
          'Marketing preferences: retained until you unsubscribe or withdraw consent',
        ]} />
      </View>

      <View>
        <H3>6. Your Rights</H3>
        <P>Under the NDPR and NDPA, you have the right to:</P>
        <Bullets items={[
          'Access the personal data we hold about you',
          'Correct inaccurate or outdated information',
          'Request deletion of your data (subject to legal retention requirements)',
          'Object to or restrict certain types of processing',
          'Withdraw your consent for marketing at any time',
          'Lodge a complaint with the Nigeria Data Protection Commission (NDPC)',
        ]} />
        <Text className="text-sm text-gray-600 mt-1">
          To exercise any of these rights, email {EMAIL}. We will respond within 30 days.
        </Text>
      </View>

      <View>
        <H3>7. Security</H3>
        <P>
          We use appropriate technical and organisational safeguards — including encryption and secure
          payment processing via Paystack — to protect your data. However, no digital transmission is
          100% secure, and we cannot guarantee absolute security.
        </P>
      </View>

      <View>
        <H3>8. Children's Privacy</H3>
        <P>
          Our website and app are not intended for children under 16. We do not knowingly collect
          personal data from children. If you believe we have done so inadvertently, contact us
          immediately and we will delete it.
        </P>
      </View>

      <View>
        <H3>9. Changes to This Policy</H3>
        <P>
          We may update this Privacy Policy as our practices or Nigerian law changes. We will notify you
          of material changes via email or a prominent notice in the app.
        </P>
      </View>

      <ContactBox />
    </View>
  );
}

function ReturnsSection() {
  return (
    <View className="gap-5">
      <P>
        We want you to be delighted with every purchase from ExploreAba. If something isn't right, we
        offer a 14-day return window from the confirmed delivery date, subject to the conditions below.
      </P>

      <View>
        <H3>1. Eligibility for Returns</H3>
        <P>To qualify for a return, all of the following must be true:</P>
        <Bullets items={[
          'Your return request is made within 14 days of the confirmed delivery date.',
          'The item is in its original, unused, and unworn condition.',
          'All original tags, labels, and packaging are intact and attached.',
          'The item has not been washed, altered, perfumed, stained, or damaged after delivery.',
          'You have your order number or proof of purchase.',
        ]} />
      </View>

      <View>
        <H3>2. Items That Cannot Be Returned</H3>
        <Bullets items={[
          'Custom/bespoke orders — items made to your measurements, design instructions, or personal specifications (except in the case of a verified manufacturing defect)',
          'Underwear, lingerie, or intimate apparel (for hygiene reasons)',
          'Items marked as "Final Sale" or "Clearance" at the time of purchase',
          'Items returned after the 14-day return window has closed',
          'Items showing signs of wear, washing, alteration, staining, or damage caused by the customer',
        ]} />
      </View>

      <View>
        <H3>3. Defective or Incorrect Items</H3>
        <P>
          If your item arrives defective, damaged (not by you), is significantly different from the
          product listing, or is the wrong item entirely — contact us within 48 hours of delivery with
          clear photos and your order number. We will arrange a free return, replacement, or full refund
          at no extra cost to you.
        </P>
      </View>

      <View>
        <H3>4. How to Return an Item</H3>
        <Steps steps={[
          { n: '01', text: `Email ${EMAIL} with your order number, the item(s) you wish to return, and the reason for the return.` },
          { n: '02', text: 'Our team will review your request within 2–3 business days and issue a return authorisation with packaging and shipping instructions.' },
          { n: '03', text: 'Pack the item(s) securely and ship using a trackable courier. Return shipping costs are your responsibility unless the return is due to our error or a manufacturing defect.' },
          { n: '04', text: 'Once we receive and inspect the returned item(s), we will process your refund or exchange within 5–7 business days.' },
        ]} />
      </View>

      <View>
        <H3>5. Exchanges</H3>
        <P>
          We offer exchanges for the same product in a different size or colour, subject to stock
          availability. Email us to check availability and arrange the exchange. The same eligibility
          conditions apply as for returns.
        </P>
      </View>

      <View>
        <H3>6. Items Lost in Return Transit</H3>
        <P>
          We strongly recommend using a trackable courier for all returns. ExploreAba is not responsible
          for return parcels lost or damaged in transit. Please retain your proof of postage.
        </P>
      </View>

      <ContactBox />
    </View>
  );
}

function RefundsSection() {
  return (
    <View className="gap-5">
      <View>
        <H3>1. When Refunds Are Issued</H3>
        <P>You are entitled to a refund in the following situations:</P>
        <Bullets items={[
          'You returned an eligible item within the 14-day window and it has passed our inspection.',
          'We cannot fulfil your order (e.g. item out of stock, unable to deliver to your location).',
          'You received a defective or incorrect item and have chosen a refund over a replacement.',
          'Your standard order was cancelled before it was dispatched.',
          'Your custom order was cancelled before production commenced (subject to the conditions in Section 5 below).',
        ]} />
      </View>

      <View>
        <H3>2. When Refunds Will NOT Be Issued</H3>
        <Bullets items={[
          'For custom/bespoke orders once production has started.',
          'For items returned outside the 14-day return window.',
          'For items not meeting our return eligibility conditions (worn, washed, damaged, altered).',
          'For change of mind on a custom order after production has commenced.',
          'For the non-refundable portion of a custom order deposit (see Section 5).',
          'For delivery/shipping fees, which are non-refundable except where the error is entirely ours.',
        ]} />
      </View>

      <View>
        <H3>3. Partial Refunds</H3>
        <P>
          In certain circumstances we may issue a partial refund — for example, if a returned item is
          not in fully original condition, or a promotional discount was applied to the order. We will
          always communicate clearly before processing a partial refund.
        </P>
      </View>

      <View>
        <H3>4. Refund Timeline</H3>
        <InfoBox color="amber">
          ⏱ How long will my refund take? Approved refunds are typically received within 7–14 business
          days from the date of approval.
        </InfoBox>
        <Bullets items={[
          'We process approved refunds on our end within 5–7 business days of approval.',
          'The refund is sent back to your original payment method (card, bank account, or wallet).',
          'Your bank or card provider may take a further 3–5 business days — this is outside our control.',
          'You will receive an email notification once the refund has been initiated from our side.',
        ]} />
      </View>

      <View>
        <H3>5. Custom Order Cancellations & Refunds</H3>
        <Bullets items={[
          'Cancelled before production begins: your deposit will be refunded minus a 10% administrative fee to cover processing costs.',
          'Cancelled after production has started: the deposit is forfeited and no refund will be issued.',
          'Order completed and ready for delivery: no refund is available, except in the case of a verified manufacturing defect or significant deviation from the agreed specifications.',
          'Manufacturing defect (our fault): we will offer a free remake or a full refund — whichever you prefer.',
        ]} />
      </View>

      <View>
        <H3>6. Refund Method</H3>
        <Bullets items={[
          'Refunds are always returned to the original payment method used for the purchase.',
          'For bank transfer payments, you will need to supply your bank account details when requesting the refund.',
          'We do not issue cash refunds.',
          'Store credit may be offered as an alternative only if you expressly prefer it.',
        ]} />
      </View>

      <View>
        <H3>7. How to Request a Refund</H3>
        <P>Email {EMAIL} with the following:</P>
        <Bullets items={[
          'Your order number',
          'A clear description of the reason for your refund request',
          'Clear photos of the item (if defective or incorrect)',
          'Your bank account details (if your original payment was a bank transfer)',
        ]} />
      </View>

      <ContactBox />
    </View>
  );
}

function CookiesSection() {
  return (
    <View className="gap-5">
      <InfoBox color="blue">
        This policy explains how we use cookies on our website. Our mobile app doesn't use browser
        cookies, but may use similar technologies (like device identifiers and analytics SDKs) for the
        same purposes described below.
      </InfoBox>

      <View>
        <H3>1. What Are Cookies?</H3>
        <P>
          Cookies are small text files placed on your device when you visit our website. They help the
          site recognise your device on return visits, remember your preferences, and improve your
          overall browsing experience.
        </P>
      </View>

      <View>
        <H3>2. Types of Cookies We Use</H3>
        <View className="gap-4 mt-2">
          {[
            { type: '🔧 Essential Cookies', desc: 'Strictly necessary for the website to function. These include session cookies that keep you logged in and maintain your shopping cart between pages. These cannot be disabled — without them, the site will not work correctly.' },
            { type: '📊 Analytics Cookies', desc: 'We use tools such as Google Analytics to understand how visitors use our site — which pages are most visited, how long people stay, and where they leave. All data is anonymised and does not identify you personally.' },
            { type: '⚙️ Preference Cookies', desc: 'These remember your settings and browsing history on our site (such as recently viewed products) to make return visits easier and faster.' },
            { type: '📣 Marketing Cookies', desc: 'With your consent, these may be used to show you relevant advertisements on other platforms. You can opt out at any time through your browser settings or by contacting us.' },
          ].map(({ type, desc }) => (
            <View key={type}>
              <Text className="text-sm font-bold text-gray-800 mb-1">{type}</Text>
              <P>{desc}</P>
            </View>
          ))}
        </View>
      </View>

      <View>
        <H3>3. Third-Party Cookies</H3>
        <P>Some cookies on our site are set by third-party services we use:</P>
        <Bullets items={[
          'Paystack — for secure payment processing',
          'Google Analytics — for website traffic and behaviour analysis',
        ]} />
        <Text className="text-sm text-gray-600 mt-1">
          These third parties operate under their own privacy and cookie policies, which we recommend reviewing.
        </Text>
      </View>

      <View>
        <H3>4. Managing Cookies</H3>
        <Text className="text-sm text-gray-600 leading-relaxed">
          You can control and manage cookies through your browser's settings on our website. Most
          browsers allow you to refuse, delete, or selectively accept cookies. Note that disabling
          essential cookies may prevent parts of our website from functioning correctly. For guidance,
          visit{' '}
          <Text
            className="text-blue-600 font-semibold"
            onPress={() => Linking.openURL('https://www.allaboutcookies.org')}
          >
            www.allaboutcookies.org
          </Text>.
        </Text>
      </View>

      <View>
        <H3>5. Updates to This Policy</H3>
        <P>
          We may update this Cookie Policy as our tools, partners, or legal requirements change.
          Significant updates will be communicated via a notice on our website or app.
        </P>
      </View>

      <ContactBox />
    </View>
  );
}

/* ── Main screen ─────────────────────────────────────────────── */
export default function LegalScreen() {
  const params = useLocalSearchParams();
  const initialTab = SECTIONS.some((s) => s.id === params.tab) ? params.tab : 'terms';
  const [active, setActive] = useState(initialTab);

  const CONTENT = {
    terms: <TermsSection />,
    privacy: <PrivacySection />,
    returns: <ReturnsSection />,
    refunds: <RefundsSection />,
    cookies: <CookiesSection />,
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center px-2 h-14 border-b border-gray-100">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center" accessibilityLabel="Back">
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-base font-black text-gray-900 tracking-tight ml-1">Legal & Policies</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        >
          {SECTIONS.map(({ id, label, emoji }) => (
            <Pressable
              key={id}
              onPress={() => setActive(id)}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                active === id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Text className="text-xs">{emoji}</Text>
              <Text className={`text-xs font-bold ${active === id ? 'text-white' : 'text-gray-600'}`}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-[11px] text-gray-400 mb-4">Effective: {EFFECTIVE}</Text>
        <View className="bg-white rounded-2xl border border-gray-100 p-5">
          {CONTENT[active]}
        </View>
      </ScrollView>
    </View>
  );
}