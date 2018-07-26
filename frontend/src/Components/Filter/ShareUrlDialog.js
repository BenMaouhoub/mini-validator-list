import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import withMobileDialog from "@material-ui/core/withMobileDialog";
import Slide from "@material-ui/core/Slide";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import ShareIcon from "@material-ui/icons/Share";

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

const styles = theme => ({
  button: {
    marginTop: theme.spacing.unit
  }
});

class AlertDialogSlide extends React.Component {
  state = {
    open: false
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <IconButton
          className={classes.button}
          aria-label="Share"
          onClick={() => this.handleClickOpen()}
        >
          <ShareIcon />
        </IconButton>
        <Dialog
          fullScreen={this.props.fullScreen}
          open={this.state.open}
          TransitionComponent={Transition}
          keepMounted
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
        >
          <DialogTitle id="alert-dialog-slide-title">
            Share the result!
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-slide-description">
              <TextField
                id="multiline-flexible"
                label="URL"
                fullWidth
                multiline
                value={this.props.url}
                margin="normal"
              />{" "}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    );
  }
}

export default withStyles(styles, { withTheme: true })(
  withMobileDialog()(AlertDialogSlide)
);
