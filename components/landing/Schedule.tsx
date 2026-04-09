'use client'

export default function Schedule() {
  const schedule = [
    { time: '2:30 AM', activity: 'Assembly — 21k runners' },
    { time: '3:00 AM', activity: 'Gun start — 21k' },
    { time: '3:30 AM', activity: 'Assembly — 10k runners' },
    { time: '4:00 AM', activity: 'Assembly — 5k runners' },
    { time: '4:30 AM', activity: 'Gun start — 10k' },
    { time: '5:00 AM', activity: 'Gun start — 5k · Assembly — 3k runners' },
    { time: '6:00 AM', activity: 'Gun start — 3k · Assembly — 1k runners' },
    { time: '6:30 AM', activity: 'Gun start — 1k' },
    {
      time: '7:00 AM',
      activity: 'Cut-off time · Color Festival & Activities',
    },
  ]

  return (
    <section id="schedule" className="py-20 px-4 bg-gradient-to-br from-primary-50 to-accent-pink/10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Event Schedule
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-pink mx-auto"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {schedule.map((item, index) => (
              <div
                key={index}
                className="p-6 hover:bg-gray-50 transition-colors flex items-center gap-6"
              >
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-lg font-bold text-primary-600">{item.time}</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-900">{item.activity}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-accent-pink"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

