import React from "react";
import PropTypes from "prop-types";

import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import SimpleCard from "../Common/SimpleCard";

const styles = theme => ({});

class ResultStatsPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { validators, classes } = this.props;

    const uniqueDomainHashMap = {};
    const uniqueDomains = validators.reduce((prev, curr) => {
      if (!uniqueDomainHashMap[curr.domain]) {
        uniqueDomainHashMap[curr.domain] = true;
        prev.push(curr);
      }
      return prev;
    }, []);

    const stats = {
      total: validators.length,
      runByRipple: validators.filter(a => a.is_ripple).length,
      default: validators.filter(a => a.default).length,
      verified: uniqueDomains.length
    };

    stats.dominance = stats.runByRipple / stats.total;

    return (
      <Grid container spacing={16}>
        <Grid item xs={6} sm={3}>
          <SimpleCard value={stats.total} description="validators" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SimpleCard value={stats.default} description="in default UNL" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SimpleCard value={stats.runByRipple} description="ripple.com" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SimpleCard
            value={Math.round(stats.dominance * 100) + "%"}
            description="dominance"
          />
        </Grid>
      </Grid>
    );
  }
}

ResultStatsPanel.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(ResultStatsPanel);
