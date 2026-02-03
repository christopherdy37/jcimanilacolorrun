'use client'

export default function EventDetails() {
  return (
    <section id="about" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About the Event
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-pink mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Join us for the most vibrant and meaningful run of the year! The JCI Manila Color Run
              is not just about running—it's about celebrating life, supporting mental health awareness,
              and creating unforgettable memories with friends and family.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              As you run through our colorful course, you'll be doused in safe, eco-friendly colored
              powder at every kilometer. Each color represents a different aspect of mental wellness,
              reminding us that mental health matters and that we're all in this together.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              All proceeds from this event will support mental health initiatives and awareness programs
              in the Philippines. Your participation makes a real difference!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Distance Options</h3>
            <div className="space-y-4">
              {[
                { distance: '1K Fun Walk', description: 'Perfect for kids and first-time participants' },
                { distance: '3K Fun Run', description: 'Perfect for families and beginners' },
                { distance: '5K Color Run', description: 'The classic color run experience' },
                { distance: '10K Challenge', description: 'For the serious runners' },
                { distance: '21K Marathon', description: 'The ultimate endurance challenge' },
              ].map((option, i) => (
                <div
                  key={i}
                  className="flex items-center p-4 rounded-lg bg-gradient-to-r from-primary-50 to-accent-pink/10 border border-primary-200"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center text-white font-bold mr-4">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{option.distance}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Event Location</h3>
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.8!2d120.9822!3d14.5358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c9f1f7c8b9b%3A0x4b5b5b5b5b5b5b5b!2zU00gTWFsbCBvZiBBc2lhLCBQYXJhxYFxZSBQYXNheSwgUGFzYXkgQ2l0eQ!5e0!3m2!1sen!2sph!4v1234567890"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  )
}

