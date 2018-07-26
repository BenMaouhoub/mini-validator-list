import React from "react";
import { connect } from "react-redux";
import * as actions from "../store/actions/index";
import { Tooltip } from "redux-tooltip";

import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import LinearProgress from "@material-ui/core/LinearProgress";

import FilterContainer from "./FilterContainer";
import StatsContainer from "./StatsContainer";
// import DomainMapContainer from "./DomainMapContainer";
import ValidatorListContainer from "./ValidatorListContainer";

import SimpleSnackbar from "../components/Common/SimpleSnackbar";
import Footer from "../components/Footer/Footer";

import withRoot from "../withRoot";
import dateTime from "../util/datetime";

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  content: {
    margin: theme.spacing.unit * 2
  },
  innerContent: {
    maxWidth: 900,
    margin: "0 auto"
  },
  gridItemTop: {
    marginTop: theme.spacing.unit * 6,
    marginBottom: theme.spacing.unit * 2
  },
  gridItem: {
    marginBottom: theme.spacing.unit * 2
  },
  gridItemBottom: {
    marginBottom: theme.spacing.unit * 1
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: "center",
    color: theme.palette.text.secondary
  },
  appBar: {
    backgroundColor: theme.palette.primary.main
  },
  appBarTitle: {
    fontFamily: "Pacifico, sans-serif",
    fontSize: "150%",
    width: "100%",
    textAlign: "center"
  }
});

class Component extends React.Component {
  componentDidMount() {
    this.props.onInitValidators();
  }

  render() {
    let content = <LinearProgress color="secondary" />;
    if (this.props.vals.ready) {
      content = (
        <React.Fragment>
          <AppBar position="fixed" className={this.props.classes.appBar}>
            <Toolbar variant="dense">
              <div className={this.props.classes.appBarTitle}>
                {this.props.title}
              </div>
            </Toolbar>
          </AppBar>
          <main className={this.props.classes.content}>
            <Grid
              container
              spacing={0}
              className={this.props.classes.innerContent}
            >
              <Grid item xs={12} className={this.props.classes.gridItemTop}>
                <FilterContainer />
              </Grid>
              <Grid item xs={12} className={this.props.classes.gridItem}>
                <StatsContainer />
              </Grid>
              {/* <Grid item xs={12} className={this.props.classes.gridItem}>
                <DomainMapContainer />
              </Grid> */}
              <Grid item xs={12} className={this.props.classes.gridItemBottom}>
                <ValidatorListContainer />
              </Grid>
            </Grid>
          </main>
          <Footer />
          <SimpleSnackbar>
            LAST UPDATED: {" " + dateTime(this.props.vals.lastUpdated)}
          </SimpleSnackbar>
          <Tooltip />
        </React.Fragment>
      );
    }

    return <div className={this.props.classes.root}>{content}</div>;
  }
}

const mapStateToProps = state => {
  return {
    vals: state.validators
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onInitValidators: () => dispatch(actions.initValidators())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRoot(withStyles(styles)(Component)));
