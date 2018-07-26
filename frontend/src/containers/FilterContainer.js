import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import * as actions from "../store/actions/index";

import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Switch from "@material-ui/core/Switch";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
// import IconButton from "@material-ui/core/IconButton";
// import DeleteIcon from "@material-ui/icons/Delete";

import ExpandablePanel from "../components/Common/ExpandablePanel";
import IntegrationAutosuggest from "../components/Filter/IntegrationAutosuggest";
// import ShareUrlDialog from "../components/Filter/ShareUrlDialog";

const styles = theme => ({
  panel: {
    width: "100%"
  },
  wrapper: {
    width: "100%"
  },
  button: {
    marginTop: theme.spacing.unit
  },
  buttonXs: {
    marginTop: theme.spacing.unit
  },
  leftIcon: {
    marginRight: theme.spacing.unit
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  iconSmall: {
    fontSize: 20
  }
});

const urlbase = "https://minivalist.cinn.app";

const createUrl = filter => {
  const qs = [];
  qs.push(`d=${filter.defaultOnly ? "y" : "n"}`);
  qs.push(`v=${filter.verifiedOnly ? "y" : "n"}`);
  qs.push(`m=${filter.mainNetOnly ? "y" : "n"}`);
  if (filter.filterWord) {
    qs.push(`w=${filter.filterWord}`);
  }
  let url = `${urlbase}?${qs.join("&")}`;
  return url;
};

const defaultFilter = {
  defaultOnly: true,
  verifiedOnly: false,
  mainNetOnly: true,
  filterWord: ""
};

const clearFilter = {
  defaultOnly: true,
  verifiedOnly: false,
  mainNetOnly: true,
  filterWord: ""
};

class Component extends React.Component {
  state = {
    ...defaultFilter,
    shareUrl: urlbase
  };

  handleApplyFilter = (type, value) => {
    this.setState(
      {
        [type]: value
      },
      () => {
        this.setState({
          shareUrl: createUrl(this.state)
        });
        this.props.onApplyFilter(this.state);
      }
    );
  };

  componentDidMount() {
    const qs = queryString.parse(window.location.search);
    if (Object.keys(qs).length > 0) {
      this.setState(
        {
          defaultOnly: qs.d === "y",
          verifiedOnly: qs.v === "y",
          mainNetOnly: qs.m === "y",
          filterWord: qs.w || this.state.filterWord
        },
        () => {
          this.setState({
            shareUrl: createUrl(this.state)
          });
          this.props.onApplyFilter(this.state);
        }
      );
    } else {
      this.props.onApplyFilter(this.state);
    }
  }

  handleClear() {
    this.setState(
      {
        ...clearFilter,
        shareUrl: urlbase
      },
      () => {
        this.props.onApplyFilter(this.state);
      }
    );
  }

  render() {
    const { classes } = this.props;

    return (
      <ExpandablePanel
        className={this.props.classes.panel}
        title="Filter"
        expanded={true}
      >
        <div className={this.props.classes.wrapper}>
          <FormGroup row>
            <Grid container spacing={0}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.defaultOnly}
                      onChange={e =>
                        this.handleApplyFilter(
                          "defaultOnly",
                          !this.state.defaultOnly
                        )
                      }
                      value="defaultOnly"
                    />
                  }
                  label="Default UNL Only"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.verifiedOnly}
                      onChange={e =>
                        this.handleApplyFilter(
                          "verifiedOnly",
                          !this.state.verifiedOnly
                        )
                      }
                      value="verifiedOnly"
                    />
                  }
                  label="Verified Domains Only"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.mainNetOnly}
                      onChange={e =>
                        this.handleApplyFilter(
                          "mainNetOnly",
                          !this.state.mainNetOnly
                        )
                      }
                      value="mainNetOnly"
                    />
                  }
                  label="Main Net Only"
                />
              </Grid>
              <Grid item xs={12}>
                <IntegrationAutosuggest
                  list={this.props.vals.filteredValidatorsForAutosuggest}
                  value={this.state.filterWord}
                  handleFilterChange={value =>
                    this.handleApplyFilter("filterWord", value)
                  }
                />
              </Grid>
              <Grid item xs={12}>
                {/* <IconButton
                  className={classes.button}
                  aria-label="Delete"
                  onClick={() => this.handleClear()}
                >
                  <DeleteIcon />
                </IconButton> */}
                {/* <ShareUrlDialog url={this.state.shareUrl} /> */}
              </Grid>
            </Grid>
          </FormGroup>
        </div>
      </ExpandablePanel>
    );
  }
}

const mapStateToProps = state => {
  return {
    vals: state.validators
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onApplyFilter: filter => dispatch(actions.filterValidators(filter))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles, { withTheme: true })(Component));
