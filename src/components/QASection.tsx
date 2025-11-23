import React from "react";

export function QASection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-foreground mb-8 sm:mb-12 md:mb-16">
          Got questions? Just ask.
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Question 1 */}
          <div className="flex justify-end px-2">
            <div className="bg-blue-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-3xl rounded-tr-sm max-w-[85%] sm:max-w-md">
              <p className="text-sm sm:text-base">How much does Drop cost?</p>
            </div>
          </div>
          
          {/* Answer 1 */}
          <div className="flex justify-start px-2">
            <div className="bg-muted text-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-3xl rounded-tl-sm max-w-[85%] sm:max-w-md">
              <p className="text-sm sm:text-base">
                We take a fraction of the selling fee with a max commission stated upfront.
              </p>
            </div>
          </div>
          
          {/* Answer 2 */}
          <div className="flex justify-start px-2">
            <div className="bg-muted text-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-3xl rounded-tl-sm max-w-[85%] sm:max-w-md">
              <p className="text-sm sm:text-base">You are only charged once the item is sold.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
