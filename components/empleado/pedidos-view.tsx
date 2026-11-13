
function QrScannerModal({
  orderId,
  securityCode,
  onValidated,
  onClose,
}: {
  orderId: string
  securityCode: string
  onValidated: () => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasValidatedRef = useRef(false)

  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')

  const cleanTarget = (securityCode || '').replace(/[^0-9]/g, '')

  const finishValidation = () => {
    if (hasValidatedRef.current) return

    hasValidatedRef.current = true
    onValidated()
  }

  // Validación mediante código manual
  const handleManualValidation = () => {
    const manualCode = (inputRef.current?.value || '')
      .replace(/[^0-9]/g, '')

    if (!cleanTarget) {
      setError('Aún no hay código registrado para este pedido.')
      return
    }

    if (manualCode === cleanTarget) {
      finishValidation()
    } else {
      setError('Código incorrecto. Verifique los 4 dígitos.')
    }
  }

  // Validación mediante QR
  const handleScan = (data: string | null) => {
    if (!data || hasValidatedRef.current) return

    if (!cleanTarget) {
      setError('Este pedido no tiene un código de seguridad registrado.')
      return
    }

    const cleanData = data.replace(/[^0-9]/g, '')

    // Se compara el código completo para evitar coincidencias parciales
    if (cleanData === cleanTarget) {
      finishValidation()
    } else {
      setError('El código QR no corresponde a este pedido.')
    }
  }

  return (
    <div className="dark">
      <Modal
        open
        onClose={onClose}
        title={`Validar Entrega · ${orderId}`}
        className="max-w-md bg-card"
      >
        <div className="flex flex-col items-center gap-6 p-6">

          {/* ESCÁNER QR COMPACTO */}
          <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-white/10 bg-black">

            <QrReader
              onResult={(result: any, scanError: any) => {
                if (result) {
                  handleScan(result.getText())
                }

                if (
                  scanError &&
                  ![
                    'NotFoundException',
                    'ChecksumException',
                    'FormatException'
                  ].includes(scanError.name)
                ) {
                  console.error('Error de cámara:', scanError)

                  setCameraError(
                    'No se pudo acceder a la cámara. Revisa los permisos del navegador.'
                  )
                }
              }}
              constraints={{
                facingMode: { ideal: 'environment' }
              }}
              scanDelay={300}
              containerStyle={{
                width: '100%',
                height: '100%',
                position: 'relative'
              }}
              videoStyle={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* DISEÑO DEL ESCÁNER */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20">
              <ScanLine className="size-8 text-white/80" />
              <span className="text-xs font-bold text-white/90">
                Escaneando...
              </span>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 animate-scan bg-brand-yellow shadow-[0_0_16px_4px] shadow-brand-yellow/60" />
          </div>

          {cameraError && (
            <p className="text-center text-xs font-semibold text-destructive">
              {cameraError}
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Coloca el código QR frente a la cámara para validar la entrega.
          </p>

          {/* VALIDACIÓN MANUAL */}
          <div className="w-full space-y-4 border-t border-border pt-5">

            <p className="flex items-center justify-center gap-2 text-center text-sm font-bold text-muted-foreground">
              <Keyboard className="size-4" />
              Ingreso manual del código
            </p>

            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 1234"
              maxLength={4}
              onChange={(e) => {
                e.target.value = e.target.value
                  .replace(/[^0-9]/g, '')
                  .slice(0, 4)

                setError('')
              }}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-center text-3xl font-black tracking-widest text-foreground focus:border-primary focus:outline-none"
            />

            <button
              type="button"
              onClick={handleManualValidation}
              disabled={
                (inputRef.current?.value || '').length < 4
              }
              className="w-full rounded-xl bg-brand-yellow py-3 font-bold text-brand-yellow-foreground transition-all hover:brightness-110"
            >
              Validar Código
            </button>

            {error && (
              <p className="text-center text-sm font-bold text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
