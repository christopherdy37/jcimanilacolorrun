'use client'

export default function Schedule() {
  const schedule = [
    { time: '3:30 AM', activity: 'Assembly' },
    { time: '4:30 AM', activity: 'Start for 10k' },
    { time: '5:00 AM', activity: 'Start for 5k' },
    { time: '6:00 AM', activity: 'Start for 3k' },
    { time: '6:30 AM', activity: 'Start for 1k' },
    { time: '7:00 AM', activity: 'Color Festival & Activities' },
    { time: '9:00 AM', activity: 'Closing & Group Photos' },
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

