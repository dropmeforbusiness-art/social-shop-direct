import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import instagramMessage from "@/assets/instagram-message.png";

export function HeroScroll() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground px-4">
              Seamless messaging, <br />
              <span className="text-3xl sm:text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Effortless selling
              </span>
            </h2>
          </>
        }
      >
        <img
          src={instagramMessage}
          alt="Instagram messaging interface"
          className="mx-auto rounded-xl sm:rounded-2xl object-contain w-full h-full max-h-full"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
