import React from "react";

export function QASection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
          Got questions? Just ask.
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Question 1 */}
          <div className="flex justify-end">
            <div className="bg-blue-500 text-white px-6 py-3 rounded-3xl rounded-tr-sm max-w-md">
              <p className="text-base">How much does Drop cost?</p>
            </div>
          </div>
          
          {/* Answer 1 */}
          <div className="flex justify-start">
            <div className="bg-muted text-foreground px-6 py-3 rounded-3xl rounded-tl-sm max-w-md">
              <p className="text-base">
                We take a fraction of the selling fee with a max commission stated upfront.
              </p>
            </div>
          </div>
          
          {/* Answer 2 */}
          <div className="flex justify-start">
            <div className="bg-muted text-foreground px-6 py-3 rounded-3xl rounded-tl-sm max-w-md">
              <p className="text-base">You are only charged once the item is sold.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
