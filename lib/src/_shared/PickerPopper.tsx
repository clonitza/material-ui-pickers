import * as React from 'react';
import clsx from 'clsx';
import Grow from '@material-ui/core/Grow';
import Paper, { PaperProps } from '@material-ui/core/Paper';
import Popper, { PopperProps } from '@material-ui/core/Popper';
import TrapFocus, { TrapFocusProps } from '@material-ui/core/Unstable_TrapFocus';
import { useForkRef } from '@material-ui/core/utils';
import { makeStyles } from '@material-ui/core/styles';
import { useGlobalKeyDown, keycode } from './hooks/useKeyDown';
import { IS_TOUCH_DEVICE_MEDIA } from '../constants/dimensions';
import { executeInTheNextEventLoopTick } from '../_helpers/utils';
import { TransitionProps } from '@material-ui/core/transitions/transition';

export interface ExportedPickerPopperProps {
  /**
   * Popper props passed down to material-ui [Popper](https://material-ui.com/api/popper/#popper-api) component.
   */
  PopperProps?: Partial<PopperProps>;
  /**
   * Custom component for [Transition](https://material-ui.com/components/transitions/#transitioncomponent-prop).
   */
  TransitionComponent?: React.ComponentType<TransitionProps>;
}

export interface PickerPopperProps extends ExportedPickerPopperProps, PaperProps {
  role: 'tooltip' | 'dialog';
  TrapFocusProps?: Partial<TrapFocusProps>;
  anchorEl: PopperProps['anchorEl'];
  open: PopperProps['open'];
  onClose: () => void;
  onOpen: () => void;
}

export const useStyles = makeStyles(
  theme => ({
    root: {
      zIndex: theme.zIndex.modal,
    },
    paper: {
      transformOrigin: 'top center',
      '&:focus': {
        outline: 'auto',
        [IS_TOUCH_DEVICE_MEDIA]: {
          outline: 0,
        },
      },
    },
    topTransition: {
      transformOrigin: 'bottom center',
    },
  }),
  { name: 'MuiPickerPopper' }
);

export const PickerPopper: React.FC<PickerPopperProps> = ({
  role,
  PopperProps,
  TrapFocusProps,
  TransitionComponent = Grow,
  open,
  innerRef = null,
  anchorEl,
  children,
  onClose,
  onOpen,
}) => {
  const classes = useStyles();
  const lastFocusedElementRef = React.useRef<Element | null>(null);
  const paperRef = React.useRef<HTMLElement>(null);
  const handlePopperRef = useForkRef(paperRef, innerRef);

  useGlobalKeyDown(open, {
    [keycode.Esc]: onClose,
  });

  React.useEffect(() => {
    if (role === 'tooltip') {
      return;
    }

    if (open) {
      lastFocusedElementRef.current = document.activeElement;
    } else if (
      lastFocusedElementRef.current &&
      lastFocusedElementRef.current instanceof HTMLElement
    ) {
      lastFocusedElementRef.current.focus();
    }
  }, [open, role]);

  const handleBlur = () => {
    if (!open) {
      return;
    }

    // document.activeElement is updating on the next tick after `blur` called
    executeInTheNextEventLoopTick(() => {
      if (paperRef.current?.contains(document.activeElement)) {
        return;
      }

      onClose();
    });
  };

  return (
    <Popper
      transition
      role={role}
      open={open}
      anchorEl={anchorEl}
      className={clsx(classes.root, PopperProps?.className)}
      {...PopperProps}
    >
      {({ TransitionProps, placement }) => (
        <TrapFocus
          open={open}
          disableAutoFocus
          disableEnforceFocus={role === 'tooltip'}
          isEnabled={() => true}
          getDoc={() => paperRef.current?.ownerDocument ?? document}
          {...TrapFocusProps}
        >
          <TransitionComponent {...TransitionProps} onEntered={onOpen}>
            <Paper
              tabIndex={-1}
              elevation={8}
              ref={handlePopperRef}
              className={clsx(classes.paper, {
                [classes.topTransition]: placement === 'top',
              })}
              onBlur={handleBlur}
            >
              {children}
            </Paper>
          </TransitionComponent>
        </TrapFocus>
      )}
    </Popper>
  );
};