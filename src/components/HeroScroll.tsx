import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import instagramMessage from "@/assets/instagram-message.png";

export function HeroScroll() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-4xl font-semibold text-foreground">
              Seamless messaging, <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Effortless selling
              </span>
            </h2>
          </>
        }
      >
        <img
          src={instagramMessage}
          alt="Instagram messaging interface"
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
