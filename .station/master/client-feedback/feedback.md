# Point cap fix

We need there points to be able to go the "offset amount" so if someone places the driver 17 (our default cap) then that driver actually finished 19, then they would receive the 2 offset points. however the 18th position is worth no "original points"

# Team Points Fix

An Idea of how sheets calculates the ties (X place + Y subsequent place(s) / Total number of people in that tie)
▪ 1st Place: =IF(J2="", "", IF(J2=1,22, IF(J2=2,(22+17)/2, IF(J2=3,(22+17+14)/3, IF(J2=4,(22+17+14+11)/4, IF(J2=5,(22+17+14+11+9)/5, "N/A"))))))
▪ 2nd Place: =IF(J3="", "", IF(J3=1,17, IF(J3=2,(17+14)/2, IF(J3=3,(17+14+11)/3, IF(J3=4,(17+14+11+9)/4, IF(J3=5,(17+14+11+9+7)/5, "N/A"))))))
