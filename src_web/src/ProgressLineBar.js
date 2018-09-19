import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

const styles = {
    root: {
        flexGrow: 1,
    },
    colorPrimary: {
        backgroundColor: '#7da87b',
    },
    barColorPrimary: {
        backgroundColor: '#f5f5c6',
    },
};

function ProgressLineBar(props) {
  const { classes } = props;
  if (props.alternative === "green") {
      return (
          <div className={classes.root} align="center">
              <LinearProgress
                  classes={{
                      colorPrimary: classes.colorPrimary,
                      barColorPrimary: classes.barColorPrimary,
                  }}
                  style={{height: "8px", width: "50%"}}
              />
          </div>
      );
  } else if (props.alternative === "blue") {
      return (
          <div align="center">
              <LinearProgress
                  style={{color: "primary", height: "8px", width: "50%"}}
          />
          </div>
      );
  }
}

ProgressLineBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ProgressLineBar);

// const styles = {
//     root: {
//         flexGrow: 1,
//     },
//     colorPrimary: {
//         backgroundColor: '#f5f5c6',
//     },
//     barColorPrimary: {
//         backgroundColor: '#7da87b',
//     },
// };
//
// class ProgressLineBar extends React.Component {
//   timer = null;
//
//   state = {
//     completed: 0,
//   };
//
//   componentDidMount() {
//     this.timer = setInterval(this.progress, 500);
//   }
//
//   componentWillUnmount() {
//     clearInterval(this.timer);
//   }
//
//   progress = () => {
//     const { completed } = this.state;
//     if (completed === 100) {
//       this.setState({ completed: 0 });
//     } else {
//       const diff = Math.random() * 5;
//       this.setState({ completed: Math.min(completed + diff, 100) });
//     }
//   };
//
//   render() {
//     const { classes } = this.props;
//     return (
//       <div className={classes.root}>
//         <LinearProgress
//             variant="determinate" value={this.state.completed}
//             classes={{ colorPrimary: classes.colorPrimary, barColorPrimary: classes.barColorPrimary }}
//         />
//       </div>
//     );
//   }
// }
//
// ProgressLineBar.propTypes = {
//   classes: PropTypes.object.isRequired,
// };
//
// export default withStyles(styles)(ProgressLineBar);