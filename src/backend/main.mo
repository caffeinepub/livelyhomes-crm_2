import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";



actor {
  public type Lead = {
    id : Nat;
    fullName : Text;
    phone : Text;
    budget : Text;
    preferredLocation : Text;
    propertyType : Text;
    leadSource : Text;
    status : Text;
    nextFollowupDate : Text;
    notes : Text;
    createdAt : Int;
  };

  public type Disposition = {
    id : Nat;
    leadId : Nat;
    status : Text;
    notes : Text;
    dateTime : Text;
    followupDate : Text;
    createdAt : Int;
  };

  public type DashboardStats = {
    totalLeads : Nat;
    followupsToday : Nat;
    siteVisitsPlanned : Nat;
    closedLeads : Nat;
  };

  module Lead {
    public func compareByCreatedAt(lead1 : Lead, lead2 : Lead) : Order.Order {
      Int.compare(lead2.createdAt, lead1.createdAt);
    };
  };

  module Disposition {
    public func compareByCreatedAt(disposition1 : Disposition, disposition2 : Disposition) : Order.Order {
      Int.compare(disposition2.createdAt, disposition1.createdAt);
    };
  };

  var nextLeadId = 1;
  var nextDispositionId = 1;
  let leads = Map.empty<Nat, Lead>();
  let dispositions = Map.empty<Nat, Disposition>();

  public shared ({ caller }) func addLead(fullName : Text, phone : Text, budget : Text, preferredLocation : Text, propertyType : Text, leadSource : Text, status : Text, nextFollowupDate : Text, notes : Text) : async Lead {
    let newLead : Lead = {
      id = nextLeadId;
      fullName;
      phone;
      budget;
      preferredLocation;
      propertyType;
      leadSource;
      status;
      nextFollowupDate;
      notes;
      createdAt = Time.now();
    };
    leads.add(nextLeadId, newLead);
    nextLeadId += 1;
    newLead;
  };

  public query ({ caller }) func getLeads() : async [Lead] {
    leads.values().toArray().sort(Lead.compareByCreatedAt);
  };

  public query ({ caller }) func getLead(id : Nat) : async Lead {
    switch (leads.get(id)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?lead) { lead };
    };
  };

  public shared ({ caller }) func updateLead(id : Nat, fullName : Text, phone : Text, budget : Text, preferredLocation : Text, propertyType : Text, leadSource : Text, status : Text, nextFollowupDate : Text, notes : Text) : async Lead {
    switch (leads.get(id)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?existingLead) {
        let updatedLead : Lead = {
          id;
          fullName;
          phone;
          budget;
          preferredLocation;
          propertyType;
          leadSource;
          status;
          nextFollowupDate;
          notes;
          createdAt = existingLead.createdAt;
        };
        leads.add(id, updatedLead);
        updatedLead;
      };
    };
  };

  public shared ({ caller }) func deleteLead(id : Nat) : async Bool {
    if (not leads.containsKey(id)) {
      return false;
    };

    let allDispositions = Map.empty<Nat, Disposition>();
    let iter = dispositions.entries();
    iter.forEach(func((k, d)) { if (d.leadId != id) { allDispositions.add(k, d) } });
    dispositions.clear();
    let finalIter = allDispositions.entries();
    finalIter.forEach(func((k, v)) { dispositions.add(k, v) });
    leads.remove(id);
    true;
  };

  public shared ({ caller }) func addDisposition(leadId : Nat, status : Text, notes : Text, dateTime : Text, followupDate : Text) : async Disposition {
    switch (leads.get(leadId)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?lead) {
        let newDisposition : Disposition = {
          id = nextDispositionId;
          leadId;
          status;
          notes;
          dateTime;
          followupDate;
          createdAt = Time.now();
        };
        dispositions.add(nextDispositionId, newDisposition);
        nextDispositionId += 1;

        let updatedLead : Lead = if (followupDate != "") {
          {
            lead with status;
            nextFollowupDate = followupDate;
          };
        } else {
          { lead with status };
        };
        leads.add(leadId, updatedLead);

        newDisposition;
      };
    };
  };

  public query ({ caller }) func getDispositions(leadId : Nat) : async [Disposition] {
    let filtered = dispositions.values().toArray().filter(func(d) { d.leadId == leadId });
    filtered.sort(Disposition.compareByCreatedAt);
  };

  public query ({ caller }) func getRecentLeads() : async [Lead] {
    let sorted = leads.values().toArray().sort(Lead.compareByCreatedAt);
    if (sorted.size() <= 5) {
      sorted;
    } else {
      Array.tabulate<Lead>(5, func(i) { sorted[i] });
    };
  };

  public query ({ caller }) func getTodayFollowups(todayDate : Text) : async [Lead] {
    let filtered = leads.values().toArray().filter(func(lead) { lead.nextFollowupDate == todayDate });
    filtered.sort(Lead.compareByCreatedAt);
  };

  public query ({ caller }) func getOverdueLeads(todayDate : Text) : async [Lead] {
    let filtered = leads.values().toArray().filter(
      func(lead) {
        lead.nextFollowupDate != "" and (lead.nextFollowupDate < todayDate)
      }
    );
    filtered.sort(Lead.compareByCreatedAt);
  };

  public query ({ caller }) func getDashboardStats(todayDate : Text) : async DashboardStats {
    let allLeads = leads.values().toArray();
    let totalLeads = allLeads.size();
    let followupsToday = allLeads.filter(func(l) { l.nextFollowupDate == todayDate }).size();
    let siteVisitsPlanned = allLeads.filter(func(l) { l.status.contains(#text("Site Visit")) and l.status.contains(#text("Planned")) }).size();
    let closedLeads = allLeads.filter(func(l) { l.status == "Final Negotiation (FN) Done" }).size();

    {
      totalLeads;
      followupsToday;
      siteVisitsPlanned;
      closedLeads;
    };
  };
};
