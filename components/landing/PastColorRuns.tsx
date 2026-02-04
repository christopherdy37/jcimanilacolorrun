'use client'

const VIDEOS = [
  { id: 'Ou9fMIgabGk', url: 'https://www.youtube.com/embed/Ou9fMIgabGk' },
  { id: 'z6Q22pn2HYo', url: 'https://www.youtube.com/embed/z6Q22pn2HYo' },
]

export default function PastColorRuns() {
  return (
    <section id="past-color-runs" className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Past Color Runs
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-pink mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Relive the fun from our previous JCI Manila Color Run events!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {VIDEOS.map((video) => (
            <div
              key={video.id}
              className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-200"
            >
              <iframe
                src={video.url}
                title={`JCI Manila Color Run - Past Event ${video.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
