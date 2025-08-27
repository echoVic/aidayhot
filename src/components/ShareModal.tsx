'use client';

import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { X } from 'lucide-react';
import React from 'react';
import { ModalProps } from '../types';

interface ShareModalProps extends ModalProps {
  maxWidth?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  children,
  title = '分享',
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      backdrop="blur"
      hideCloseButton
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.3,
              ease: [0.25, 0.25, 0, 1]
            }
          },
          exit: {
            y: -20,
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: 0.2,
              ease: [0.25, 0.25, 0, 1]
            }
          }
        }
      }}
      classNames={{
        backdrop: "bg-black/20 backdrop-blur-md",
        base: "bg-white/95 backdrop-blur-xl border-0 shadow-2xl max-h-[85vh] max-w-[60vw]",
        header: "border-0 pb-0",
        body: "pt-0 overflow-y-auto",
      }}
    >
      <ModalContent className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
        <ModalHeader className="flex items-center justify-between px-8 pt-8 pb-6">
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-normal">
              选择你喜欢的分享方式
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-all duration-200 backdrop-blur-sm group"
            aria-label="关闭"
          >
            <X className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
          </button>
        </ModalHeader>
        <ModalBody className="px-8 pb-8">
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShareModal;