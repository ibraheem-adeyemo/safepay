import React from 'react';

const WhatsappBtn = ({phoneNumber, preMessage, chatBtnCont, bottomPosition="bottom-6"}: {phoneNumber:string; preMessage: string; chatBtnCont:string; bottomPosition?:string}) => {
  return (
    <div className={`fixed ${bottomPosition}  right-6 z-50`}>
      <a
        href={`https://wa.me/${phoneNumber}?text=${preMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex items-center gap-2
          bg-[#25D366] text-white
          px-5 py-3
          rounded-full
          shadow-lg
          font-semibold text-sm
          hover:bg-[#1ebe5d]
          transition-all duration-200
        "
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="w-5 h-5"
        />
        <span className="hidden sm:inline">
          {chatBtnCont}
        </span>
      </a>
    </div>
  );
};

export default WhatsappBtn;