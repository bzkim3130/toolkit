interface Props {
  label: string
  masked: string | null
  value: string
  onChange: (v: string) => void
}

export function SecretField({ label, masked, value, onChange }: Props) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={masked ?? '설정되지 않음 — 새 값 입력'}
        autoComplete="off"
        className="input"
      />
      <p className="mt-1 text-[11px] text-slate-600">
        {masked ? '비워두면 기존 값이 유지됩니다. 새 값을 입력하면 저장 시 교체됩니다.' : '입력한 값은 저장 시 DPAPI로 암호화되어 로컬에만 저장됩니다.'}
      </p>
    </div>
  )
}
