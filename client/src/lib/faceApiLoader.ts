let loadPromise: Promise<any> | null = null

function getFaceApiFromWindow() {
  return (window as any).faceapi
}

export async function loadFaceApi(): Promise<any> {
  const existing = getFaceApiFromWindow()
  if (existing) return existing

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
      script.defer = true
      script.onload = () => {
        const lib = getFaceApiFromWindow()
        if (!lib) reject(new Error('faceapi_not_loaded'))
        else resolve(lib)
      }
      script.onerror = () => reject(new Error('faceapi_not_loaded'))
      document.head.appendChild(script)
    })
  }

  return await loadPromise
}

