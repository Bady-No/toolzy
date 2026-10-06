import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolHeader } from '../common/ToolHeader';
import { generateQr, buildWifiQrString, buildVCardString, QrOptions } from '../../utils/qrUtils';
import { downloadDataUrl, downloadBlob } from '../../utils/fileUtils';
import { 
  QrCode, 
  Download, 
  Palette, 
  Link2, 
  Type, 
  Wifi, 
  Mail, 
  Phone, 
  UserSquare2, 
  Image as ImageIcon,
  Check,
  Sparkles,
  FileCode
} from 'lucide-react';

type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'vcard';

export const QrGenerator: React.FC = () => {
  const { t, showToast } = useApp();

  const [qrType, setQrType] = useState<QrType>('url');

  // Input states
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [textInput, setTextInput] = useState('مرحباً بك في صندوق الأدوات');
  const [wifiSsid, setWifiSsid] = useState('MyHomeWifi');
  const [wifiPass, setWifiPass] = useState('SecretPass123');
  const [wifiEnc, setWifiEnc] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [emailTo, setEmailTo] = useState('hello@example.com');
  const [phoneNum, setPhoneNum] = useState('+966500000000');
  const [vcardName, setVcardName] = useState('محمد أحمد');
  const [vcardOrg, setVcardOrg] = useState('ToolBox Inc.');
  const [vcardTitle, setVcardTitle] = useState('مصمم واجهات');
  const [vcardPhone, setVcardPhone] = useState('+966500000000');
  const [vcardEmail, setVcardEmail] = useState('m.ahmed@example.com');

  // Design settings
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [resolution, setResolution] = useState(1000);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);

  // Result output
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const getPayloadText = (): string => {
    switch (qrType) {
      case 'url':
        return urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
      case 'text':
        return textInput || ' ';
      case 'wifi':
        return buildWifiQrString(wifiSsid, wifiPass, wifiEnc);
      case 'email':
        return `mailto:${emailTo}`;
      case 'phone':
        return `tel:${phoneNum}`;
      case 'vcard':
        return buildVCardString({
          name: vcardName,
          org: vcardOrg,
          title: vcardTitle,
          phone: vcardPhone,
          email: vcardEmail,
        });
    }
  };

  const updateQr = async () => {
    const payload = getPayloadText();
    if (!payload.trim()) return;

    setIsGenerating(true);
    try {
      const res = await generateQr(payload, {
        width: resolution,
        fgColor,
        bgColor,
        logoDataUrl,
      });

      setQrPngUrl(res.dataUrl);
      setQrSvg(res.svg);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    updateQr();
  }, [
    qrType,
    urlInput,
    textInput,
    wifiSsid,
    wifiPass,
    wifiEnc,
    emailTo,
    phoneNum,
    vcardName,
    vcardOrg,
    vcardTitle,
    vcardPhone,
    vcardEmail,
    fgColor,
    bgColor,
    resolution,
    logoDataUrl,
  ]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(reader.result as string);
      showToast('تمت إضافة الشعار في منتصف الكود بنجاح', 'success');
    };
    reader.readAsDataURL(file);
  };

  const downloadPng = () => {
    if (!qrPngUrl) return;
    downloadDataUrl(qrPngUrl, `qr-code-${qrType}.png`);
    showToast('تم تنزيل كود QR بصيغة PNG', 'success');
  };

  const downloadSvgFile = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `qr-code-${qrType}.svg`);
    showToast('تم تنزيل كود QR بصيغة SVG المتجهية', 'success');
  };

  const typeTabs: Array<{ id: QrType; label: string; icon: any }> = [
    { id: 'url', label: t('tools.qrGenerate.typeUrl'), icon: Link2 },
    { id: 'text', label: t('tools.qrGenerate.typeText'), icon: Type },
    { id: 'wifi', label: t('tools.qrGenerate.typeWifi'), icon: Wifi },
    { id: 'email', label: t('tools.qrGenerate.typeEmail'), icon: Mail },
    { id: 'phone', label: t('tools.qrGenerate.typePhone'), icon: Phone },
    { id: 'vcard', label: t('tools.qrGenerate.typeVcard'), icon: UserSquare2 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <ToolHeader tool="qr-generate" />

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Settings Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Type Selector Tabs */}
          <div className="p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800/80 grid grid-cols-3 sm:grid-cols-6 gap-1">
            {typeTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setQrType(tab.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    qrType === tab.id
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Type Specific Fields */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('tools.qrGenerate.qrContent')}
            </h3>

            {qrType === 'url' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  رابط الموقع (URL)
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  النص المطلوب ترميزه
                </label>
                <textarea
                  rows={3}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="اكتب أي نص أو رسالة هنا..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('tools.qrGenerate.networkName')}
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="SSID"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('tools.qrGenerate.networkPass')}
                  </label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('tools.qrGenerate.encryption')}
                  </label>
                  <select
                    value={wifiEnc}
                    onChange={(e) => setWifiEnc(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="WPA">{t('tools.qrGenerate.wpa')}</option>
                    <option value="WEP">{t('tools.qrGenerate.wep')}</option>
                    <option value="nopass">{t('tools.qrGenerate.none')}</option>
                  </select>
                </div>
              </div>
            )}

            {qrType === 'email' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
              </div>
            )}

            {qrType === 'phone' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  رقم الهاتف (مع الرمز الدولي)
                </label>
                <input
                  type="tel"
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="+966500000000"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('tools.qrGenerate.contactName')}
                  </label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('tools.qrGenerate.contactOrg')}
                  </label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('tools.qrGenerate.contactTitle')}
                  </label>
                  <input
                    type="text"
                    value={vcardTitle}
                    onChange={(e) => setVcardTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visual Customization Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-500" />
              <span>{t('tools.qrGenerate.qrDesign')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('tools.qrGenerate.fgColor')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('tools.qrGenerate.bgColor')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Logo in Center */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  إضافة شعار في المنتصف
                </span>
                <span className="text-[11px] text-gray-400">
                  سيتم دمج أيقونة أو لوجو شركتك بأمان في وسط الرمز
                </span>
              </div>

              <div className="flex items-center gap-2">
                {logoDataUrl && (
                  <button
                    onClick={() => setLogoDataUrl(undefined)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    إزالة
                  </button>
                )}
                <label className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold cursor-pointer flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{logoDataUrl ? 'تغيير الشعار' : 'رفع شعار'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Live Preview Column */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              معاينة فورية لكود QR
            </span>

            <div className="p-4 rounded-2xl bg-white shadow-md border border-gray-100 dark:border-gray-800 flex items-center justify-center max-w-[280px] w-full aspect-square">
              {qrPngUrl ? (
                <img
                  src={qrPngUrl}
                  alt="Generated QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Download Buttons */}
            <div className="w-full space-y-2">
              <button
                onClick={downloadPng}
                disabled={!qrPngUrl}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <Download className="w-4 h-4" />
                <span>{t('tools.qrGenerate.downloadPng')}</span>
              </button>

              <button
                onClick={downloadSvgFile}
                disabled={!qrSvg}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <FileCode className="w-4 h-4 text-emerald-500" />
                <span>{t('tools.qrGenerate.downloadSvg')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
