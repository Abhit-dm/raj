/* Phone number entry with the OTP boxes opening underneath, used by login and sign-up. */
import { useEffect, useRef, useState } from 'react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { Btn, Field } from '../../components/app/ui';
import { authService, apiError } from '../../services/api';
import { useT } from '../../i18n';
import { cn } from '../../lib/utils';

const OTP_LEN = 4;

export const OtpBoxes = ({ value, onChange, disabled, error }: { value: string; onChange: (v: string) => void; disabled?: boolean; error?: boolean }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setAt = (i: number, digit: string) => {
    const chars = value.padEnd(OTP_LEN, ' ').split('');
    chars[i] = digit || ' ';
    onChange(chars.join('').replace(/\s+$/, '').replace(/ /g, ''));
  };

  return (
    <div className="flex justify-between gap-3">
      {Array.from({ length: OTP_LEN }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`OTP digit ${i + 1}`}
          maxLength={OTP_LEN}
          disabled={disabled}
          value={value[i] ?? ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            if (digits.length > 1) { // pasted or auto-filled code
              onChange(digits.slice(0, OTP_LEN));
              refs.current[Math.min(digits.length, OTP_LEN) - 1]?.focus();
              return;
            }
            setAt(i, digits);
            if (digits && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className={cn(
            'h-16 w-full min-w-0 rounded-2xl border-2 bg-white text-center text-[26px] font-bold text-brand-navy outline-none transition-colors focus:border-brand-orange',
            error ? 'border-red-400' : value[i] ? 'border-brand-navy/30' : 'border-slate-200',
          )}
        />
      ))}
    </div>
  );
};

type Props = {
  /* Called after a correct OTP. For existing users `session` holds the login. */
  onVerified: (r: { isNewUser: boolean; phone: string; signupToken?: string; session?: unknown }) => void;
  /* Login screen: tell the user to sign up instead of sending an OTP to an unknown number */
  requireRegistered?: boolean;
  onNotRegistered?: () => void;
  initialPhone?: string;
};

export const PhoneOtp = ({ onVerified, requireRegistered, onNotRegistered, initialPhone = '' }: Props) => {
  const t = useT();
  const [phone, setPhone] = useState(initialPhone);
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const sendOtp = async () => {
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone)) { setError(t('invalid_phone')); return; }
    setBusy(true);
    try {
      const res = await authService.sendOtp(phone);
      const data = res.data.data;
      if (requireRegistered && !data.isRegistered) { setError(t('not_registered')); onNotRegistered?.(); return; }
      setTestMode(!!data.testMode);
      setStage('otp');
      setOtp('');
      setCountdown(30);
    } catch (e) {
      setError(apiError(e, t('something_wrong')));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (code: string) => {
    setError('');
    setBusy(true);
    try {
      const res = await authService.verifyOtp(phone, code);
      const data = res.data.data;
      if (data.isNewUser) onVerified({ isNewUser: true, phone, signupToken: data.signupToken });
      else onVerified({ isNewUser: false, phone, session: data });
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? t('wrong_otp') : apiError(e, t('something_wrong')));
      setOtp('');
    } finally {
      setBusy(false);
    }
  };

  // Verify as soon as all 4 digits are in
  useEffect(() => {
    if (stage === 'otp' && otp.length === OTP_LEN && !busy) void verify(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, stage]);

  return (
    <div className="space-y-5">
      {stage === 'phone' ? (
        <>
          <Field
            label={t('mobile_number')}
            lead={<span className="flex items-center gap-1.5">🇮🇳 <span>+91</span><span className="h-6 w-px bg-slate-200" /></span>}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={10}
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
            error={error}
            autoFocus
          />
          <Btn onClick={sendOtp} loading={busy} disabled={phone.length !== 10}>{t('send_otp')}</Btn>
        </>
      ) : (
        <div className="animate-slide-up space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-brand-navy/5 px-4 py-3">
            <div>
              <p className="text-[13px] text-slate-500">{t('otp_sent_to')}</p>
              <p className="text-[16px] font-bold text-brand-navy">+91 {phone.slice(0, 5)} {phone.slice(5)}</p>
            </div>
            <button onClick={() => { setStage('phone'); setError(''); }} className="pressable flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[13px] font-semibold text-brand-orange shadow-card">
              <Pencil className="h-3.5 w-3.5" /> {t('change_number')}
            </button>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-slate-600">{t('enter_otp')}</p>
            <OtpBoxes value={otp} onChange={(v) => { setOtp(v); setError(''); }} disabled={busy} error={!!error} />
            {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}
          </div>
          {testMode && (
            <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] font-medium text-amber-800">
              <ShieldCheck className="h-4 w-4 shrink-0" /> {t('otp_test_hint')}
            </p>
          )}
          <Btn onClick={() => verify(otp)} loading={busy} disabled={otp.length !== OTP_LEN}>{t('verify')}</Btn>
          <div className="text-center">
            {countdown > 0
              ? <span className="text-[14px] text-slate-400">{t('resend_in', { s: countdown })}</span>
              : <button onClick={sendOtp} className="text-[14px] font-semibold text-brand-orange">{t('resend_otp')}</button>}
          </div>
        </div>
      )}
    </div>
  );
};
